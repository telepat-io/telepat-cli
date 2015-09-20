var telepatJS = require('telepat-js');
var Telepat = new telepatJS();

var eventChannel;
var environment = null;
var connectOptions = {
    apiKey: null,
    appId: null,
    apiEndpoint: null,
    socketEndpoint: null,
    timerInterval: 150
};
var connected = false;

Telepat.setLogLevel('debug');

Telepat.on('logout', function () {
    console.log("User logged out.");
});

Telepat.on('connect', function () {
    console.log("Connected to Telepat instance");
    connected = true;
});

Telepat.on('contexts-update', function () {
    console.log("Contexts retrieved");
});

function connect(appId, apiKey) {
    if(environment==null) {
        console.log("Environment configuration error");
        return;
    }
    connectOptions.appId = appId;
    connectOptions.apiKey = apiKey;
    connectOptions.apiEndpoint = "http://"+environment.telepat_host+":"+environment.telepat_port;
    connectOptions.socketEndpoint = "http://"+environment.telepat_host;
    Telepat.connect(connectOptions);
}

//function addObject() {
//    eventChannel.objects['new'] = {
//        text: 'Hello world'
//    };
//}
//
//function removeObject(id) {
//    delete eventChannel.objects[id];
//}
//
//function editObject(id) {
//    eventChannel.objects[id].text = $('#' + id + '_input').val();
//}

function subscribe(contextId, modelName) {
    eventChannel = Telepat.subscribe({ channel: { context: contextId, model: modelName }}, function () {
        console.log(JSON.stringify(eventChannel.objects))   ;
    });
    eventChannel.on('update', function (operation, parentId, parentObject, delta) {
        console.log(operation, parentId, parentObject, delta);
        if (operation == 'delete') {
            console.log("ParentID: "+parentId+" removed");
        } else if (operation == 'add') {
            console.log("ParentID: "+parentId+" updated");
        } else if (operation == 'replace') {
            console.log("ParentID: "+parentId+" replaced");
        }
    });
    eventChannel.on('unsubscribe', function () {
        console.log("Unsubscribed");
    });
}

function passEnvironment(env) {
    environment = env;
}

exports.TelepatClient = Telepat;
exports.connected = connected;
exports.connect = connect;
exports.subscribe = subscribe;
exports.passEnvironment = passEnvironment;