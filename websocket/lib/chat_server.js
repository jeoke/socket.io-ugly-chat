var socketio = require('socket.io');
var io;
var numUsers = 0;
var p_roomname = {'default': 0};
exports.listen = function(server) {
	io = socketio(server);
	io.on('connection',function (socket) {
		var addedUser = false;
		
		socket.on('new message',function(data){
             socket.broadcast.emit('new message',{
             	username: socket.username,
             	message: data.message,
             	currentRoom:data.currentRoom
             });
		});

		socket.on('add user',function (data) {
			if (addedUser) {
				return false;
			}

			socket.username = data.username;
			++numUsers;
			p_roomname.default = numUsers;
			addedUser = true;
			socket.emit('login',{
				username:socket.username,
				currentRoom:data.currentRoom,
				currentNumer:numUsers
			});

			socket.broadcast.emit('user joined', {
			username:socket.username,
			currentRoom:data.currentRoom,
			currentNumer:numUsers
			});
		});

		socket.on('typing',function(){
			socket.broadcast.emit('typing',{
				username:socket.username
			});
		});

		socket.on('stop typing', function () {
		   socket.broadcast.emit('stop typing', {
		     username: socket.username
		   });
		 });

		 socket.on('disconnect', function () {
		   if (addedUser) {
		     --numUsers;

		     socket.broadcast.emit('user left', {
		       username: socket.username,
		       numUsers: numUsers
		     });
		   }
		 });

		 socket.on('add room',function(data) {
		 	roomname=data.newRoom,
		 	eval("p_roomname." + roomname +  "=" + data.newRoomNumber);

		 });

         socket.on('room',function(){
            socket.emit('rooms',p_roomname);
         })
         
         socket.on('user joined',function(data) {
         	for (var i in p_roomname) {
         		if(data.newRoom === i){
         		var  currentNumer = p_roomname[i];
         		     ++currentNumer;
         		     p_roomname[i] = currentNumer;
         		    socket.broadcast.emit('user joined',{
         		    	username:data.username,
         		    	currentRoom:data.newRoom,
         		    	currentNumer:currentNumer
         		    });
         		}
         	}
         });
       
		 socket.on('leave room',function(data) {
		 	for (var i in p_roomname) {
		 		if(data.currentRoom === i){
		 	      var currentNumer = p_roomname[i];
		 		      --currentNumer;
		 		      p_roomname[i] = currentNumer;
		 	        socket.broadcast.emit('leave room',{
		 		    	username:data.username,
		 		    	currentRoom:data.currentRoom,
		 		    	currentNumer:currentNumer
		 		    });
		 		}
		 	}

		 });

});
};

