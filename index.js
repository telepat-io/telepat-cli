#! /usr/bin/env node

var fs = require('fs');
var helpers = require( __dirname + '/helpers.js');
var TelepatWrapper = require( __dirname+'/telepat_wrapper.js');
var env_data = helpers.retrieveEnv();

TelepatWrapper.passEnvironment(env_data);

//Get the command-line arguments
//var userArgs = process.argv.slice(2);

var appId, apiKey, email, password, name, post_data;

var arguments = require('yargs').argv;
var mainAction = arguments['_'][0];
var secondaryAction = arguments['_'][1];
//console.log(JSON.stringify(arguments, null, 2));
//console.log(typeof arguments.name);
//console.log(typeof arguments.apiKey);
//return;

//Switch by the provided action
switch(mainAction) {
	case "add":
		switch(secondaryAction) {
			case "admin":
				email = arguments.email;
				password = arguments.password;
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
                appId = helpers.retrieveArgument('appId', arguments);
                apiKey = helpers.retrieveArgument('apiKey', arguments);
                email = helpers.retrieveArgument('email', arguments);
                password = helpers.retrieveArgument('password', arguments);
                name = arguments.name;

                if(appId===undefined || apiKey === undefined || email===undefined || password===undefined || name===undefined) {
                    console.log("appID, apiKey, email, password and name are required");
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
                TelepatWrapper.connect(appId, apiKey);
                break;
			case "app":
				name = arguments.name;
				if(name === undefined) {
					console.log("Application name required");
					return;
				}
				var keys = arguments.apiKey;
				post_data = {
					"name": name,
					"keys": keys
				};
				helpers.login(env_data.email, env_data.password, function() {
					helpers.doTelepatRequest("/admin/app/add", JSON.stringify(post_data), function(response) {
						var appId = response.content.id;
                        helpers.setEnvKey('appId', appId);
						console.log("Added app with ID: " + appId);
					});
				});

				break;
			case "context":
                appId = helpers.retrieveArgument('appId', arguments);
				var contextName = arguments.contextName;
				if(appId === undefined || contextName === undefined) {
					console.log("appId and contextName are required");
					return;
				}
				post_data = {
					"appId" : appId,
					"name" : contextName,
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
		switch(secondaryAction) {
			case "schema":
                appId = helpers.retrieveArgument('appId', arguments);
                var schemaFile = arguments.filename;

				if(appId===undefined || schemaFile===undefined) {
					console.log("appId and filename required");
					return;
				}

				fs.readFile(schemaFile, 'utf-8', function (err, data) {
				  if (err) {
				    console.log('FATAL An error occurred trying to read in the file: ' + err);
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
				if(arguments['_'][2]===undefined) {
					console.log("Parameter value required");
					return;
				}
				helpers.setEnvKey(secondaryAction, arguments['_'][2]);
				console.log(secondaryAction+" value set to: "+arguments['_'][2]);

		}
		break;
    case "subscribe":
		//TODO add filters
        appId = helpers.retrieveArgument('appId', arguments);
        apiKey = helpers.retrieveArgument('apiKey', arguments);
        contextId = helpers.retrieveArgument('contextId', arguments);
        modelName = helpers.retrieveArgument('modelName', arguments);
        telepat_user = helpers.retrieveArgument('telepat_user', arguments);
        telepat_user_password = helpers.retrieveArgument('telepat_user_password', arguments);

		if(appId===undefined || apiKey===undefined || contextId===undefined || modelName===undefined) {
			console.log("appID, apiKey, contextId and modelName are required. telepat_user " +
                "and telepat_user_password are optional.");
			return;
		}
        TelepatWrapper.TelepatClient.on("connect", function() {
            TelepatWrapper.TelepatClient.user.login(telepat_user, telepat_user_password);
        });
        TelepatWrapper.TelepatClient.on("login", function() {
            console.log("Logged in. Subscribing to channel");
            TelepatWrapper.subscribe(contextId, modelName);
        });
        TelepatWrapper.connect(appId, apiKey);
        break;
	case "list":
        switch(secondaryAction) {
            case "configs":
                console.log(JSON.stringify(env_data, null, 2));
                break;
            default:
                console.log("Unknown parameter for list.");
        }
		break;
	case "configure":
        switch(secondaryAction) {
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