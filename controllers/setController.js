var BaseController = require('./baseController').BaseController;
var fs = require('fs');
var SetController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment, mainController);
    this.route = "set";
    this.mainController = mainController;
};

SetController.prototype = Object.create(BaseController.prototype);
SetController.prototype.constructor = SetController;

SetController.prototype.unknownAction = function(route, action) {
    if(this.arguments['_'][2]===undefined) {
        console.log("Parameter value required");
        return;
    }
    this.helpers.setEnvKey(action, this.arguments['_'][2]);
    console.log(action+" value set to: "+this.arguments['_'][2]);
};

exports.SetController = SetController;

SetController.prototype.schema = function () {
    var appId = this.helpers.retrieveArgument('appId', this.arguments);
    var schemaFile = this.arguments.filename;

    if(appId===undefined || schemaFile===undefined) {
        console.log("appId and filename required");
        return;
    }

    var self=this;

    fs.readFile(schemaFile, 'utf-8', function (err, data) {
        if (err) {
            console.log('FATAL An error occurred trying to read in the file: ' + err);
            process.exit(-2);
        }
        // Make sure there's data before we post it
        if(data) {
            self.helpers.doTelepatRequest("/admin/schema/update", data, function() {
                console.log("Application schema updated");
            }, appId);
        }
        else {
            console.log("No data to post");
            process.exit(-1);
        }
    });
};

