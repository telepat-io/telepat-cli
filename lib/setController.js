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

SetController.prototype.schema = function (callback) {
    var appId = this.helpers.retrieveArgument('appId', this.arguments);
    var schemaFile = this.arguments.filename;
    var schemaData = this.arguments.schemaData;

    if(appId===undefined || (schemaData===undefined && schemaFile===undefined)) {
        console.log("appId and filename or schemaData required");
        return;
    }

    var self=this;
    if(schemaFile !== undefined) {
        fs.readFile(schemaFile, 'utf-8', function (err, data) {
            if (err) {
                console.log('FATAL An error occurred trying to read in the file: ' + err);
                if(callback!==undefined) callback();
                process.exit(-2);
            }
            // Make sure there's data before we post it
            if (data) {
                data = data.replace('"appId": 1', '"appId": "'+appId+'"');
                self.helpers.doTelepatRequest("/admin/schema/update", data, function () {
                    console.log("Application schema updated");
                    if(callback!==undefined) callback();
                }, appId);
            }
            else {
                console.log("No data to post");
                if(callback!==undefined) callback();
                process.exit(-1);
            }
        });
    } else {
        self.helpers.doTelepatRequest("/admin/schema/update", schemaData, function () {
            console.log("Application schema updated");
            if(callback!==undefined) callback();
        }, appId);
    }
};

