var BaseController = require('./baseController').BaseController;
var TelepatWrapper = require( '../telepat_wrapper.js');
var SubscribeController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment, mainController);
    this.route = "subscribe";
    this.mainController = mainController;
};

SubscribeController.prototype = Object.create(BaseController.prototype);
SubscribeController.prototype.constructor = SubscribeController;

SubscribeController.prototype.respond = function (action) {
    var appId = this.helpers.retrieveArgument('appId', this.arguments);
    var apiKey = this.helpers.retrieveArgument('apiKey', this.arguments);
    var contextId = this.helpers.retrieveArgument('contextId', this.arguments);
    var modelName = this.helpers.retrieveArgument('modelName', this.arguments);
    var telepat_user = this.helpers.retrieveArgument('telepat_user', this.arguments);
    var telepat_user_password = this.helpers.retrieveArgument('telepat_user_password', this.arguments);

    if(appId===undefined || apiKey===undefined || contextId===undefined || modelName===undefined) {
        console.log("appID, apiKey, contextId and modelName are required. telepat_user " +
            "and telepat_user_password are optional.");
        return;
    }

    TelepatWrapper.passEnvironment(this.environment);
    TelepatWrapper.TelepatClient.on("connect", function() {
        console.log(telepat_user+" "+telepat_user_password);
        TelepatWrapper.TelepatClient.user.login(telepat_user, telepat_user_password);
    });
    TelepatWrapper.TelepatClient.on("login", function() {
        console.log("Logged in. Subscribing to channel");
        TelepatWrapper.subscribe(contextId, modelName);
    });
    TelepatWrapper.connect(appId, apiKey);
};

exports.SubscribeController = SubscribeController;