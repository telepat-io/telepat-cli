var http = require('http');
var environment=undefined;

if (typeof ls === "undefined" || ls === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  ls = new LocalStorage(__dirname+'/settings-storage');
}

function doTelepatRequest(path, post_data, callback, app_id) {
	if(environment===undefined) return;

	// An object of options to indicate where to post to
	var post_options = {
	  host: environment.telepat_host,
	  port: environment.telepat_port,
	  path: path,
	  method: 'POST',
	  headers: {
	      'Content-Type': 'application/json',
	      'Content-Length': post_data.length
	  }
	};

	if(environment.jwt !== undefined) {
		post_options.headers["Authorization"] = "Bearer "+environment.jwt;
	}

	if(app_id !== undefined) {
		post_options.headers["X-BLGREQ-APPID"] = app_id;
	}

	doRequest(post_options, post_data, callback);
}

function doRequest(post_options, post_data, callback) {
	// Set up the request
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		if(callback!==undefined) res.on('data', function (chunk) {
			//console.log(chunk);
			callback(JSON.parse(chunk));
		});
		else {
			res.on('data', function (chunk) {
				console.log('Response: ' + chunk);
			});
		}
	});

	// post the data
	post_req.write(post_data);
	post_req.end();
}

function setEnv(env) {
	environment = env;
}

function setEnvKey(key, value) {
	environment[key] = value;
	ls.setItem("env_vars", JSON.stringify(environment));
}

function retrieveEnv() {
	var env_vars = ls.getItem('env_vars');
	if(env_vars === null) return {};
	return JSON.parse(env_vars);
}

function login(email, password, callback) {
	var post_data = JSON.stringify({
	  'email' : email,
	  'password': password
	});
	doTelepatRequest("/admin/login", post_data, function(parsedResponse) {
		if(parsedResponse.status==200) {
			environment.jwt = parsedResponse.content.token;
			ls.setItem('env_vars', JSON.stringify(environment));
            console.log("Admin login OK.");
			if(callback!==undefined) callback();
		}
		else 
			console.log("Admin login failed.");
	});
}

exports.doTelepatRequest=doTelepatRequest;
exports.doRequest=doRequest;
exports.setEnv=setEnv;
exports.setEnvKey=setEnvKey;
exports.retrieveEnv=retrieveEnv;
exports.login=login;