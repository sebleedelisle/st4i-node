
// simple websocket example - clients can broadcast to all other clients
// any data will just get forwarded on.

var connect = require('connect'), 
	ws = require('websocket.io'), 
	connections = [];

var app = connect(); 

app.use(connect.static(__dirname+'/public'));
app.listen(8101); 

function broadcast(from, msg) {
  connections.forEach(function (socket) {
    if ((from !== socket)){
      socket.send(msg);
	}
  });
}

ws.attach(app).on('connection', function(sock){

	console.log("new client", sock); 
	sock.send(JSON.stringify({type:'connect'})); 
	
	console.log('connected'); 
	console.log(sock); 
		
	connections.push(sock); 
	
	sock.on('message', function(msg) { 
		
		console.log(msg); 
		
		broadcast(null, msg);
		
		try{
			var data = JSON.parse(msg); 
		} catch(e) {
			console.log('invalid message : '+e); 
			return;
		}	
		
		
	}).on('close', function() { 
	
		console.log('disconnected'); 
		deleteConnection(sock); 
	
	}).on('error', function() { 
		
		console.log('ERROR!'); 
	    deleteConnection(sock); 
	}); 
	
	
}); 

function deleteConnection(sock) { 
	var i = connections.indexOf(sock);
    // remove the cached connection
    if (i !== -1) {
      connections.splice(i, 1);
	}
}
