// Setup basic express server
var express = require('express');
var app = express();
var http = require('http');
var server = require('http').createServer(app);
var io = require('./')(server);
var port = process.env.PORT || 3000;

// var req = http.request({host: 'localhost', port: 3000, method: 'POST'}, function(res) {});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
    //notifications sockets

    socket.on('subscribe notifications', function (user_id) {
        console.log('connected to user id', user_id);
        socket.join(user_id);
    });

    socket.on('new message notif', function (data) {
        socket.broadcast.to(data.user_id).emit('new message notif', {
            sender_id: data.sender_id,
            name: data.name,
            picture: data.picture
        });
    });

    socket.on('new match notif', function (data) {
        socket.broadcast.to(data.user_id).emit('new match notif', {
            user_id: data.user_id,
            name: data.name,
            picture: data.picture
        });
    });

    socket.on('new visitor notif', function (data) {
        socket.broadcast.to(data.user_id).emit('new visitor notif', {
            user_id: data.user_id,
            name: data.name,
            picture: data.picture
        });
    });
    
    
    //chat sockets
    var addedUser = false;

    socket.on('subscribe', function (room) {
        console.log('joining room', room);
        socket.join(room);
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.to(data.room).emit('new message', {
            name: socket.name,
            message: data.message
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (data) {
        if (addedUser) return;

        // we store the name in the socket session for this client
        socket.name = data.name;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        // socket.broadcast.to(data.room).emit('user joined', {
        //     name: socket.name,
        //     numUsers: numUsers
        // });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function (room) {
        socket.broadcast.to(room).emit('typing', {
            name: socket.name
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function (room) {
        socket.broadcast.to(room).emit('stop typing', {
            name: socket.name
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function (room) {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            // socket.broadcast.to(room).emit('user left', {
            //     name: socket.name,
            //     numUsers: numUsers
            // });
        }
    });
});
