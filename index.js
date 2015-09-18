#! /usr/bin/env node

var fs = require( 'fs');
var helpers = require( __dirname + '/helpers.js');
//var telepat = require( __dirname+'/telepat_integration.js');

var env_data = helpers.retrieveEnv();
//valid env fields: telepat_host, telepat_port, jwt
helpers.setEnv(env_data);

//Get the command-line arguments
var userArgs = process.argv.slice(2);
var mainAction = userArgs[0];

//Switch by the provided action
switch(mainAction) {
	case "add":
		var addType = userArgs[1];
		switch(addType) {
			case "admin":
				var email = userArgs[2];
				var password = userArgs[3];
				if(email === undefined || password === undefined) {
					console.log("Email and password required");
					return;
				}
				// Build the post string from an object
				var post_data = JSON.stringify({
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
			case "app":
				var name = userArgs[2];
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
				var post_data = {
					"name": name,
					"keys": keys
				}
				helpers.login(env_data.email, env_data.password, function() {
					helpers.doTelepatRequest("/admin/app/add", JSON.stringify(post_data), function(response) {
						var appId = response.content.id;
						// helpers.setEnvKey("app_id", appId);
						console.log("Added app with ID: " + appId);
					});
				});

				break;
			case "context":
				var appId = userArgs[2];
				var contextName = userArgs[3];
				if(appId === undefined || contextName === undefined) {
					console.log("Application ID and context name are required");
					return;
				}
				var post_data = {
					"appId" : appId,
					"name" : name,
					"state" : 0
				}
				helpers.doTelepatRequest("/admin/context/add", JSON.stringify(post_data), function(response) {
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
				var appId = userArgs[2];
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
	case "configure":
        var entity = userArgs[1];
        switch(entity) {
            case "elasticsearch":
                // An object of options to indicate where to post to
                var post_options = {
                    host: env_data.elasticsearch_host===undefined?'127.0.0.1':environment.elasticsearch_host,
                    port: env_data.elasticsearch_port===undefined?'9200':environment.elasticsearch_port,
                    path: '/default',
                    method: 'POST'
                };
                var post_data = JSON.stringify({
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
		console.log("Unknown command. Valid actions are: add, set, configure");
}