var BaseController = require('./baseController').BaseController;
var TelepatWrapper = require( '../telepat_wrapper.js');
var async = require('async');
var AddController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment, mainController);
    this.route = "add";
    this.mainController = mainController;
};

AddController.prototype = Object.create(BaseController.prototype);
AddController.prototype.constructor = AddController;

AddController.prototype.unknownAction = function(route, action) {
    console.log("Unknown add parameter. Valid ones are: admin, app, context");
};

exports.AddController = AddController;

AddController.prototype.app = function (callback) {
    var name = this.arguments.name;
    if(name === undefined) {
        console.log("Application name required");
        return;
    }
    var keys = this.arguments.apiKey;
    if(typeof keys === 'string') {
        keys = [keys];
    }

    var post_data = {
        "name": name,
        "keys": keys
    };
    if(keys===null) delete post_data.keys;
    var apiKey = undefined;
    if(this.arguments.apiKey !== undefined) {
        apiKey = keys[0];
    }

    var self=this;
    this.helpers.login(this.environment.email, this.environment.password, function() {
        self.helpers.doTelepatRequest("/admin/app/add", JSON.stringify(post_data), function(response) {
            var appId = response.content.id;
            self.helpers.setEnvKey('appId', appId);
            self.helpers.setEnvKey('apiKey', apiKey);
            console.log("Added app with ID: " + appId);
            if(callback!==undefined) callback();
        });
    });
};
AddController.prototype.admin = function(callback) {
    var email = this.arguments.email;
    var password = this.arguments.password.toString();
    if(email === undefined || password === undefined) {
        console.log("Email and password required");
        return;
    }
    // Build the post string from an object
    var post_data = JSON.stringify({
        'email' : email,
        'password': password
    });
    var self = this;
    this.helpers.doTelepatRequest("/admin/add", post_data, function() {
        console.log("Admin created. Trying to log in...");
        self.helpers.setEnvKey("email", email);
        self.helpers.setEnvKey("password", password);
        setTimeout(function() {
            self.helpers.login(email, password, function() {
                if(callback!==undefined) callback();
            });
        }, 1000);
    });
};

AddController.prototype.user = function(callback) {
    var appId = this.helpers.retrieveArgument('appId', this.arguments);
    var apiKey = this.helpers.retrieveArgument('apiKey', this.arguments);
    var email = this.helpers.retrieveArgument('telepat_user', this.arguments);
    var password = this.helpers.retrieveArgument('telepat_user_password', this.arguments);
    var name = this.arguments.name;

    if(appId===undefined || apiKey === undefined || email===undefined || password===undefined || name===undefined) {
        console.log("appId, apiKey, telepat_user, telepat_user_password and name are required");
        return;
    }

    var userProfile = JSON.stringify({
        'email' : email,
        'password': password,
        'name': name
    });
    TelepatWrapper.passEnvironment(this.environment);
    TelepatWrapper.TelepatClient.on("connect", function() {
        TelepatWrapper.TelepatClient.user.register(userProfile, function () {
            console.log("User created");
            TelepatWrapper.TelepatClient.disconnect();
            if(callback!==undefined) callback();
        });
    });
    TelepatWrapper.connect(appId, apiKey);
};

AddController.prototype.context = function(callback) {
    var appId = this.helpers.retrieveArgument('appId', this.arguments);
    var contextName = this.arguments.contextName;
    if(appId === undefined || contextName === undefined) {
        console.log("appId and contextName are required");
        return;
    }
    var post_data = {
        "appId" : appId,
        "name" : contextName,
        "state" : 0
    };
    var self = this;
    this.helpers.login(this.environment.email, this.environment.password, function() {
        self.helpers.doTelepatRequest("/admin/context/add", JSON.stringify(post_data), function (response) {
            console.log("Context created: "+JSON.stringify(response.content.id, null, 2));
            self.helpers.setEnvKey("contextId", response.content.id);
            if(callback!==undefined) callback();
        }, appId);
    });
};

AddController.prototype.demoApp = function(cb) {
    var self = this;
    async.waterfall([
        function (callback) {
            self.arguments.email = "demo_user@telepat.example";
            self.arguments.password = "testPass";
            self.mainController.perform('add', 'admin', self.arguments, callback);
        }, function(callback) {
            delete self.arguments.email;
            delete self.arguments.password;
            self.arguments.name = "Test Application";
            self.arguments.apiKey = "testApiKey";
            self.mainController.perform('add', 'app', self.arguments, callback);
        }, function(callback) {
            delete self.arguments.name;
            delete self.arguments.apiKey;
            self.arguments.filename = __dirname+"/../demo_schema.json";
            self.mainController.perform('set', 'schema', self.arguments, callback);
        }, function(callback) {
            delete self.arguments.filename;
            self.arguments.contextName = "Demo Context";
            self.mainController.perform('add', 'context', self.arguments, callback);
        }
    ], function() {
        console.log("Demo app is now set up.");
        if(cb!==undefined) cb();
    });
};
