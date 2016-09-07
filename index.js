#! /usr/bin/env node

var helpers = require( __dirname + '/helpers.js');
var TelepatWrapper = require( __dirname+'/telepat_wrapper.js');
var env_data = helpers.retrieveEnv();

var BaseController = require('./lib/baseController.js').BaseController;
var AddController  = require('./lib/addController.js').AddController;
var SetController  = require('./lib/setController.js').SetController;
var SubscribeController  = require('./lib/subscribeController.js').SubscribeController;
var ListController  = require('./lib/listController.js').ListController;
var ConfigureController  = require('./lib/configureController.js').ConfigureController;
var RunController  = require('./lib/runController.js').RunController;

TelepatWrapper.passEnvironment(env_data);

var arguments = require('yargs').argv;
var mainAction = arguments['_'][0];
var secondaryAction = arguments['_'][1];
var mainController = new BaseController(helpers, arguments, env_data);
mainController.registeredControllers.push(new AddController(helpers, arguments, env_data, mainController));
mainController.registeredControllers.push(new SetController(helpers, arguments, env_data, mainController));
mainController.registeredControllers.push(new ListController(helpers, arguments, env_data, mainController));
mainController.registeredControllers.push(new SubscribeController(helpers, arguments, env_data, mainController));
mainController.registeredControllers.push(new ConfigureController(helpers, arguments, env_data, mainController));
mainController.registeredControllers.push(new RunController(helpers, arguments, env_data, mainController));
mainController.perform(mainAction, secondaryAction, arguments);