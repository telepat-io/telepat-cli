var telepatJS = require('telepat-js');
var Telepat = new telepatJS();

var eventChannel;
var model = 'events';
var connectOptions = {
    apiKey: '1234key',
    appId: 1,
    apiEndpoint: 'http://localhost:3000',
    socketEndpoint: 'http://localhost',
    timerInterval: 150
};

Telepat.setLogLevel('debug');

Telepat.on('login', function () {
    $('#message').html("");
    //subscribe();
});

Telepat.on('logout', function () {
    console.log("logged out");
});

Telepat.on('connect', function () {
    console.log("Connected to Telepat instance");
    //subscribe();
});

Telepat.on('contexts-update', function () {
    console.log("Contexts retrieved");
    subscribe();
});

connect();

function connect() {
    Telepat.connect(connectOptions);
}

function addObject() {
    eventChannel.objects['new'] = {
        text: 'Hello world'
    };
}

function removeObject(id) {
    delete eventChannel.objects[id];
}

function editObject(id) {
    eventChannel.objects[id].text = $('#' + id + '_input').val();
}

function appendToList(key, value) {
    $('.list-group').append('<li class="list-group-item" id="' + key + '">' + key + ': <input type="text" id="' + key + '_input" value="' + value.text + '" onkeyup="editObject(\'' + key + '\');"> <span id="' + key + '_span">' + value.text + '</span><div style="float:right"><a class="btn btn-default btn-sm" href="#" onclick="removeObject(\'' + key + '\'); return false;">Delete</a></div></li>');
}

function subscribe() {
    eventChannel = Telepat.subscribe({ channel: { context: Telepat.contexts[0].id, model: model }}, function () {
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

exports.hangOnTillExit = hangOnTillExit
function hangOnTillExit(fun){
    process.stdin.resume()
    'SIGINT SIGTERM SIGHUP exit'.split(' ').forEach(function(evt){
        process.on(evt, function(){
            process.stdin.pause()
            fun()
        })
    })
}

exports.exitIfErrorElse = exitIfErrorElse
function exitIfErrorElse(callback){
    return function(err){
        if (err){
            console.error(err.message)
            return process.exit(1)
        }
        var args = Array.prototype.slice.call(arguments, 1)
        callback.apply(this, args)
    }
}

exitIfErrorElse();