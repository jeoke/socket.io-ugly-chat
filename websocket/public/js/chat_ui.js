$(function(){
     var FADE_TIME = 150;
     var TYPING_TIMER_LENGTH = 400;
     var COLORS = [
       '#e21400', '#91580f', '#f8a700', '#f78b00',
       '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
       '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
     ];

     var username;
     var roomnames = ['default'];       
     var p_roomNames={'default':0};    
     var connected = false;
     var typing = false;
     var lastTypingTime = undefined;
     var currentRoom = 'default';    
     var currentNumer = undefined;
     var roomname = undefined;
     var $currentInput = $('.usernameInput').focus();
     var newRoom="undefined";  
     var socket = io();

    function setUsername() {
    	username = cleanInput($('.usernameInput').val().trim());

    	if (username) {
    		 $('.login.page').fadeOut();
    		 $('.chat.page').show();
    		 $('.login.page').off('click');
    		 $currentInput = $('.inputMessage').focus();
    	     //Tell the server your username;
    	     socket.emit('add user',{
                 username:username,
                 currentRoom:currentRoom
             });
    	}
    }

    function cleanInput(input) {
	    return $('<div/>').text(input).html();
    }

    function sendMessage(currentRoom) {
    	var message =  $('.inputMessage').val();
        roomname='default';
    	//prevent makeup from injecting 
    	message = cleanInput(message);
        if(currentRoom === currentRoom){
    	if (message && connected) {
    		$('.inputMessage').val('');
    		addChatMessage({
    			username: username,
                currentRoom: currentRoom,
    			message: message
    		});

        socket.emit('new message',{
            currentRoom: currentRoom,
            message:message
        });
    	}
     }else{return false;}
    }
    
    function addChatMessage(data,options) {
        if(currentRoom === data.currentRoom){
   		var typingMessages = getTypingMessages(data);
      		options = options || {};
       	if (typingMessages.length !== 0) {
        	options.fade = false;
            typingMessages.remove();
        }

        var imgEl = $('<img  class="imgEl" src="./img/avatar.png" alt="default avatar" />');
    	var usernameDiv = $('<h3 class="username"/>').text(data.username).css('color',getUsernameColor(data));
    	var messageBodyDiv = $('<div class="messageBody clear"/>').text(data.message);
    	var typingClass = data.typing ? 'typing' : '';
    	var messageDiv = $('<div class="message" />').data('username',data.username).addClass(typingClass).append(usernameDiv,messageBodyDiv);
      	var mediaObj = $('<div class="media">').append(imgEl,messageDiv);
            addMessageElement(mediaObj,options);
    }else{return false}
    }

    function addMessageElement(el,options) {
        var $el = $(el);

        if (!options) {
        	options = {};
        }
        if (typeof options.fade === 'undefined') {
        	options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
        	options.prepend = false;
        }

        if (options.fade) {
        	$el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
        	$('.messages').prepend(el);
        } else {
        	$('.messages').append(el);
        }
        $('.messages')[0].scrollTop = $('.messages')[0].scrollHeight;
    }


    function getTypingMessages(data) {
    	return $('.typing.message').filter(function(i) {
           return $(this).data('username') === data.username;
    	});
    }

    function updateTyping() {
  
    	if (connected) {
    		if (!typing) {
    			typing = true;
    			socket.emit('typing');
    		}
    		lastTypingTime =(new Date()).getTime();

    		setTimeout(function() {
    			var typingTimer = (new Date()).getTime();
    			var timeDiff = typingTimer - lastTypingTime;
    			if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
    				socket.emit('stop typing');
    				typing = false;
    			}
    		},TYPING_TIMER_LENGTH);
    	}
    }

    function log (message, options) {
       var el = $('<li>').addClass('log').text(message);
       addMessageElement(el, options);
    }

    function addParticipantsMessage(data) {
    	var message = '';
    	if (data.currentNumer === 1) {
    		message += "there is 1 participant";
    	}else{
    		message += "there are " + data.currentNumer + "participant";
    	}
    	log(message);
    }
    
    function addChatTyping (data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }
    //removes typing message
    function removeChatTyping(data) {
    	getTypingMessages(data).fadeOut(function () {
    		$(this).remove();
    	});
    }
    function getUsernameColor(username){
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        var index = Math.abs(hash % COLORS.length) ;
        return COLORS[index];
    } 
    
    function divEscapedContentElement(p_roomName) {
    	return $('<div></div>').addClass("" +  p_roomName + "").text(p_roomName);
    }

    function clear() {
        $('#inputPassword').removeClass('tip').attr('placeholder','roomname');
    }

    function showtip() {
        $('#inputPassword').addClass('tip').attr('placeholder','room is full');
        setTimeout(clear,2000);
    }

    function vClick() {
            newRoom = $(this).text();
            if(currentRoom === newRoom){               
                 return false;
            }else{                                     
                newRoom = "." + newRoom ;
                currentRoom = "." + currentRoom;             
                $(newRoom).removeClass('wrap').addClass('click');     
                $(currentRoom).removeClass('click').addClass('wrap');  
                $('.messages').empty();                                                   
                socket.emit('leave room',{                                      
                    currentRoom:currentRoom,
                    username:username
                });
                var message = "welcome to chat";
                  log(message,{
                     prepend:true
                });
                log(username + '  joined'); 
                newRoom = newRoom.match(/[^\.]\S*/)[0];                  
                currentRoom = newRoom;                                         
                socket.emit('user joined',{
                    newRoom:currentRoom,
                    username:username
               });
            }
    }
    $(window).keydown(function(event) {

    	if (event.which === 13) {
    		if (username) {
    			sendMessage(currentRoom);
    			socket.emit('stop typing');
    			typing = false;
    		}else{             
    			setUsername();
    		}
    	}
    });
   
    $('.inputMessage').on('input',function() {
        updateTyping();
    });

    $('.inputMessage').click(function() {
    	$('.inputMessage').focus();
    })
    $('.login.page').click(function() {
    	$currentInput.focus();
    });
   
    socket.on('login',function(data){
    	connected =true;
        if (data.currentRoom = currentRoom) {
          var message = "welcome to chat";
              currentNumer = data.currenNumer;
          log(message,{
              prepend:true
             });
          log(data.username + '  joined');
          addParticipantsMessage(data);
        } else {
          return false;
          }
    });

    socket.on('user joined',function (data) {
    	if(data.currentRoom === currentRoom){
            log(data.username + '  joined');
    	    addParticipantsMessage(data);
        }
    });

    socket.on('new message', function (data) {
        addChatMessage(data);
    });

    socket.on('ueser left',function (data) {
    	log(data.username + 'left');
    	addParticipantsMessage(data);
    	removeChatTyping(data);
    });

    socket.on('typing',function(data){
    	addChatTyping(data);
    });

    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });

    socket.on('disconnect',function(){
    	log('you have been disconnected');
        $('#v_room').empty();
    });

    socket.on('reconnect',function () {
    	log('you have been reconnected');
        if(username){
        	socket.emit('add user',username);
        }
    });

    socket.on('reconnect_error', function () {
       log('attempt to reconnect has failed');
     });
    
    function deduplication(k,v){
         r
    }

    $('.default').click(vClick);
    $('.add').click(function() {
    	roomname = $('.roomname').val().trim();
    	if(roomname){
            var p_roomArr = [];
    		$('.roomname').val('');
            for (var i in p_roomNames){
                p_roomArr.push(i);
            }

    		for (var i in p_roomNames) {   
    		    if(roomname === i){        
    		    	return false;           
    		    }else{                      
                    if (roomnames.length <= 10) {
                       if($.inArray(roomname,roomnames)==-1 && $.inArray(roomname,p_roomArr) == -1) {
                       roomnames.push(roomname);
                       }

                    }else{
                      showtip();
                      return false;
                    }
                } 
            }                        
    		var el = $('<div></div>').addClass(roomname + ' wrap effect').text(roomname); 
            el.click(vClick);
    	        $('#v_room').append(el);                                           
                var newRoomNumber = 0;                                 
    		socket.emit('add room',{
                newRoom:roomname,
                newRoomNumber:newRoomNumber
            });
    	}
    });

    socket.on('rooms',function(data) {
      		      p_roomNames = data;
     		      $('#left').empty();
	    	if (data != '') {
			    for (var i in p_roomNames) {
			      $('#left').append(divEscapedContentElement(i));
			}
		}
        $('#left div').addClass('wrap effect');    
        $('#left div').click(function() {                                   
            newRoom = $(this).text();
            if(newRoom !== currentRoom){
                newRoom = "." + newRoom ;
                currentRoom = "." + currentRoom;  
                $(newRoom).removeClass('wrap').addClass('click');     
                $(currentRoom).removeClass('click').addClass('wrap');                            
                $('.messages').empty();
                socket.emit('leave room',{
                    currentRoom:currentRoom,
                    username:username
                });
                var message = "welcome to chat";
                log(message,{
                    prepend:true
                });
                newRoom = newRoom.match(/[^\.]\S*/)[0];                
                currentRoom = newRoom;   
                log(username + '  joined');
                socket.emit('user joined',{
                    newRoom:newRoom,
                    username:username,
                });
                currentRoom = newRoom;
            }else{return false;}
        });

    });
	
    setInterval(function(){
        socket.emit('room')
    },1000);

    socket.on('leave room',function(data) {
        console.log(currentRoom);
    	if(data.currentRoom === currentRoom){
    		log(data.username + '  has leave');
            currentNumer = data.currentNumer;
            addParticipantsMessage({
                    username:data.username,
                    currentRoom:data.currentRoom,
                    currentNumer:currentNumer
                });
    	}else{
            return false;
        }
    });
});