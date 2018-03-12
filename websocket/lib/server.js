//已完善
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./chat_server');
var cache = {};

function send404(response){
	response.writeHead(404,{'content-Type':'text/plain'});
	response.write('Error 404 : resource not found');
	response.end();
}

function sendFile(response,filePath,fileContents) {
	response.writeHead(200,{
		'content-Type':mime.getType(path.basename(filePath))
	});
	response.end(fileContents);
}

function serverStatic(response,cache,absPath) {
	if (cache[absPath]) {
		sendFile(response,absPath,cache[absPath]);
	} else {
		fs.exists(absPath,function(exists) {
			if (exists) {
				fs.readFile(absPath,function(err,data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response,absPath,data);
					}
				})
			} else {
				send404(response);
			}
		});
	}
}

function handler(require,response) {
	var filePath = false;
    
    if (require.url === '/') {
    	filePath = 'public\/index.html';
    } else {
    	filePath = 'public' + require.url;
    }

    var absPath = ".././" + filePath;
    serverStatic(response,cache,absPath);
}

var app = http.createServer(handler);

app.listen(3000,function() {
	console.log("server listening on port 3000");
});
chatServer.listen(app);







