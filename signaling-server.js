var PORT = 8080;
var fs = require('fs');
/*var privateKey  = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.cert', 'utf8');

var credentials = {key: privateKey, cert: certificate};*/
var express = require('express');
var app = express();

// your express configuration here

var https = require('https');
var http = require('http');
var transform = require('sdp-transform');
var bodyParser = require('body-parser');
var main = express();
var server = http.createServer(main);
var wss = https.createServer(main);
var io  = require('socket.io').listen(server);

server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});

main.get('/client', function(req, res){ res.sendFile(__dirname + '/client.html'); });
main.get('/', function(req, res){ res.sendFile(__dirname + '/uses.html'); });
main.get('/audio', function(req, res){ res.sendFile(__dirname + '/1313.mp3'); });
main.get('/close', function(req, res)
    {
        io.emit('close'); 
        res.send('ok'); 
});

var channels = {};
var sockets = {};

 

io.sockets.on('connection', function (socket) {
    socket.channels = {};
    sockets[socket.id] = socket;

    console.log("["+ socket.id + "] connection accepted");
    socket.on('quit', function () {
        for (var channel in socket.channels) {
            part(channel);
        }
        console.log("["+ socket.id + "] disconnected");
        delete sockets[socket.id];
    });

    socket.on('call', function () {
        console.log("active call");
        https.get('https://d7245a244c5e.ngrok.io/send');
    });
	socket.on('close', function () {
        console.log("clooooooooooooooooooose");
            io.emit('close');
    });


	socket.on('save', function (config){
		const fs = require('fs');
		
		fs.writeFile('sdp.txt', config.session_description.sdp, (err) =>{
			if (err) throw err;
			
			console.log("sdp saved");
		})
	});

    socket.on('create_join', function (config) {
        console.log("["+ socket.id + "] join ", config);
        var channel = config.channel;
        var userdata = config.userdata;

        if (channel in socket.channels) {
            console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        for (id in channels[channel]) {
            channels[channel][id].emit('joined', {'peer_id': socket.id, 'offer': false});
            socket.emit('joined', {'peer_id': id, 'offer': true});
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });

    socket.on('local_create_join', function (config) {
        console.log("["+ socket.id + "] join ", config);
        var channel = config.channel;
        var userdata = config.userdata;

        if (channel in socket.channels) {
            console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }
        
        sockets[socket.id].emit('local_joined', {'peer_id': socket.id, 'offer': false});

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });
    function part(channel) {
        console.log("["+ socket.id + "] part ");

        if (!(channel in socket.channels)) {
            console.log("["+ socket.id + "] ERROR: not in ", channel);
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    }
    socket.on('part', part);

    socket.on('relayICECandidate', function(config) {
        var peer_id = config.peer_id;
        var ice_candidate = config.ice_candidate;
        console.log(config.ice_candidate.sdpMid)
        
        console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('ready', function(config) {
        var peer_id = config.peer_id;
        var session_description = config.session_description;
		var fs = require('fs');
		
        console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);
		
        if (peer_id in sockets) {
            sockets[peer_id].emit('offer', {'peer_id': socket.id, 'session_description': session_description});
        }
    });
    socket.on('answer', function(config) {
        var peer_id = config.peer_id;
        config.sdp.type = "offer"
        var session_description = config.sdp;
        var fs = require('fs');
        
        console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);
        io.emit('ans', {'peer_id': socket.id, 'session_description': session_description});
        if (peer_id in sockets) {
            sockets[peer_id].emit('ans', {'peer_id': socket.id, 'session_description': session_description});
        }
    });
	
	socket.on('ready_local', function(config) {
        var peer_id = config.peer_id;
		var fs = require('fs');
		var contents = "";
		
		
		fs.readFile('sdp.txt', 'utf8', function(err, contents) {
			console.log("---");
			//console.log(contents);
            console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", transform.parse(contents));
            io.emit('offer', {'peer_id': socket.id, 'sdp': contents});
		});
		
		
		
		
        //console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", contents);
		

        //io.emit('offer', {'peer_id': socket.id, 'sdp': contents});
       //io.emit('offer', 'qwerty');
       //socket.broadcast.send('qwerty');
    });
});
