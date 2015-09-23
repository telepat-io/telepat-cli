var BaseController = require('./baseController').BaseController;
var TelepatWrapper = require( '../telepat_wrapper.js');
var ListController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment, mainController);
    this.route = "list";
    this.mainController = mainController;
};

ListController.prototype = Object.create(BaseController.prototype);
ListController.prototype.constructor = ListController;

exports.ListController = ListController;

ListController.prototype.configs = function() {
    console.log(JSON.stringify(this.environment, null, 2));
};

ListController.prototype.apps = function() {
    var self = this;
    this.helpers.login(this.environment.email, this.environment.password, function() {
        self.helpers.doTelepatRequest("/admin/apps", null, function(response) {
            console.log(response.content);
        }, null, 'GET');
    });
};

ListController.prototype.contexts = function() {
    var appId = this.helpers.retrieveArgument('appId', arguments);
    var apiKey = this.helpers.retrieveArgument('apiKey', arguments);

    if(appId===undefined || apiKey === undefined) {
        console.log("appId, apiKey are required");
        return;
    }

    TelepatWrapper.passEnvironment(this.environment);

    TelepatWrapper.TelepatClient.on('contexts-update', function () {
        console.log(JSON.stringify(TelepatWrapper.TelepatClient.contexts, null, 2));
        TelepatWrapper.TelepatClient.disconnect();
    });
    TelepatWrapper.connect(appId, apiKey);
};

