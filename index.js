#! /usr/bin/env node

var fs = require( 'fs');
var helpers = require( __dirname + '/helpers.js');
var TelepatWrapper = require( __dirname+'/telepat_integration.js');
var env_data = helpers.retrieveEnv();

TelepatWrapper.passEnvironment(env_data);

//Get the command-line arguments
var userArgs = process.argv.slice(2);
var mainAction = userArgs[0];

var appId, email, password, name, post_data;

//Switch by the provided action
switch(mainAction) {
	case "add":
		var addType = userArgs[1];
		switch(addType) {
			case "admin":
				email = userArgs[2];
				password = userArgs[3];
				if(email === undefined || password === undefined) {
					console.log("Email and password required");
					return;
				}
				// Build the post string from an object
				post_data = JSON.stringify({
				  'email' : email,
				  'password': password
				});
				helpers.doTelepatRequest("/admin/add", post_data, function() {
					console.log("Admin created. Trying to log in...");
					helpers.setEnvKey("email", email);
					helpers.setEnvKey("password", password);
                    setTimeout(function() {
                        helpers.login(email, password);
                    }, 1000);
				});

				break;
            case "user":
                appId = userArgs[2];
                email = userArgs[3];
                password = userArgs[4];
                name = userArgs[5];

                if(appId===undefined || email===undefined || password===undefined || name===undefined) {
                    console.log("AppID, email, password and name are required");
                    return;
                }

                var userProfile = JSON.stringify({
                    'email' : email,
                    'password': password,
                    'name': name
                });
                TelepatWrapper.TelepatClient.on("connect", function() {
                    TelepatWrapper.TelepatClient.user.register(userProfile, function () {
                        console.log("User created");
                        TelepatWrapper.TelepatClient.disconnect();
                    });
                });
                TelepatWrapper.connect();
                break;
			case "app":
				name = userArgs[2];
				if(name === undefined) {
					console.log("Application name required");
					return;
				}
				var keys = [];
				var i = 3;
				while(userArgs[i]!==undefined) {
					keys.push(userArgs[i]);
					i++;
				}
				post_data = {
					"name": name,
					"keys": keys
				};
				helpers.login(env_data.email, env_data.password, function() {
					helpers.doTelepatRequest("/admin/app/add", JSON.stringify(post_data), function(response) {
						var appId = response.content.id;
						// helpers.setEnvKey("app_id", appId);
						console.log("Added app with ID: " + appId);
					});
				});

				break;
			case "context":
				appId = userArgs[2];
				var contextName = userArgs[3];
				if(appId === undefined || contextName === undefined) {
					console.log("Application ID and context name are required");
					return;
				}
				post_data = {
					"appId" : appId,
					"name" : name,
					"state" : 0
				};
				helpers.doTelepatRequest("/admin/context/add", JSON.stringify(post_data), function() {
                    console.log("Context created");
                }, appId);
				break;
			default:
				console.log("Unknown add parameter. Valid ones are: admin, app, context");
		}
		break;
	case "set":
		var setVar = userArgs[1];
		switch(setVar) {
			// case "email":
			// case "password":
			case "schema":
				if(userArgs[2]===undefined || userArgs[3]===undefined) {
					console.log("Application ID and schema file path required");
					return;
				}
				var schemaFile = userArgs[3];
				appId = userArgs[2];
				fs.readFile(schemaFile, 'utf-8', function (err, data) {
				  if (err) {
				    // If this were just a small part of the application, you would
				    // want to handle this differently, maybe throwing an exception
				    // for the caller to handle. Since the file is absolutely essential
				    // to the program's functionality, we're going to exit with a fatal
				    // error instead.
				    console.log("FATAL An error occurred trying to read in the file: " + err);
				    process.exit(-2);
				  }
				  // Make sure there's data before we post it
				  if(data) {
				  	helpers.doTelepatRequest("/admin/schema/update", data, function() {
				  		console.log("Application schema updated");
				  	}, appId);
				  }
				  else {
				    console.log("No data to post");
				    process.exit(-1);
				  }
				});
				break;
			default:
				if(userArgs[2]===undefined) {
					console.log("Parameter value required");
					return;
				}
				helpers.setEnvKey(userArgs[1], userArgs[2]);
				console.log(userArgs[1]+" value set to: "+userArgs[2]);

		}
		break;
    case "subscribe":
		//TODO add filters
		appId = userArgs[1];
		var apiKey = userArgs[2];
		var contextId = userArgs[3];
		var modelName = userArgs[4];
		email = userArgs[5];
		password = userArgs[6];
		if(appId===undefined || apiKey===undefined || contextId===undefined || modelName===undefined) {
			console.log("AppID, apiKey, contextId and modelName are required. Username and password are optional.");
			return;
		}
        TelepatWrapper.TelepatClient.on("connect", function() {
            TelepatWrapper.TelepatClient.user.login(email, password);
        });
        TelepatWrapper.TelepatClient.on("login", function() {
            console.log("Logged in. Subscribing to channel");
            TelepatWrapper.subscribe(contextId, modelName);
        });
        TelepatWrapper.connect(appId, apiKey);
        break;
	case "list":
		break;
	case "configure":
        var entity = userArgs[1];
        switch(entity) {
            case "elasticsearch":
                // An object of options to indicate where to post to
                var post_options = {
                    host: env_data.elasticsearch_host===undefined?'127.0.0.1':env_data.elasticsearch_host,
                    port: env_data.elasticsearch_port===undefined?'9200':env_data.elasticsearch_port,
                    path: '/default',
                    method: 'POST'
                };
                post_data = JSON.stringify({
                    "mappings": {
                        "_default_": {
                            "dynamic_templates": [
                                {
                                    "string_template": {
                                        "mapping": {
                                            "index": "not_analyzed",
                                            "type": "string"
                                        },
                                        "match_mapping_type": "string",
                                        "match": "*"
                                    }
                                }
                            ]
                        }
                    },
                    "settings": {
                        "index": {
                            "number_of_replicas": "1",
                            "number_of_shards": "1"
                        }
                    }
                });
                helpers.doRequest(post_options,post_data);
                break;
            default:
                console.log("Unknown configure argument.")
        }
		break;
	default:
		console.log("Unknown command. Valid actions are: add, set, configure, subscribe, list");
}