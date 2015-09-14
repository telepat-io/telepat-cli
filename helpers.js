var http = require('http');
var environment=undefined;

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage(__dirname+'/settings-storage');
}
 
// localStorage.setItem('myFirstKey', 'myFirstValue');
// console.log(localStorage.getItem('myFirstKey'));

function doRequest(path, post_data, callback, app_id) {
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

	// Set up the request
	var post_req = http.request(post_options, function(res) {
	  res.setEncoding('utf8');
	  if(callback!==undefined) res.on('data', function (chunk) {
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
	localStorage.setItem("env_vars", JSON.stringify(environment));
}

function retrieveEnv() {
	return JSON.parse(localStorage.getItem('env_vars'));
}

function login(email, password, callback) {
	var post_data = JSON.stringify({
	  'email' : email,
	  'password': password
	});
	doRequest("/admin/login", post_data, function(parsedResponse) {
		if(parsedResponse.status==200) {
			environment.jwt = parsedResponse.content.token;
			localStorage.setItem('env_vars', JSON.stringify(environment));
			if(callback!==undefined) callback();
		}
		else 
			console.log("Admin login failed.");
	});
}

exports.doRequest=doRequest;
exports.setEnv=setEnv;
exports.setEnvKey=setEnvKey;
exports.retrieveEnv=retrieveEnv;
exports.login=login;