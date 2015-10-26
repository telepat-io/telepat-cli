var BaseController = require('./baseController').BaseController;
var RunController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment);
    this.route = "run";
    this.mainController = mainController;
};

RunController.prototype = Object.create(BaseController.prototype);
RunController.prototype.constructor = RunController;

RunController.prototype.script = function(callback) {
    if(this.arguments.fileName === undefined) {
        console.log("No script fileName specified");
        return;
    }
    console.log("CLI - running script - "+this.arguments.fileName);
    var scripToRun = require(this.arguments.fileName);
    scripToRun.perform(this.mainController, callback);
};

exports.RunController = RunController;