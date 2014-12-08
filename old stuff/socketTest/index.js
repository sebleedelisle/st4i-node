var net = require('net');
require('longjohn');

var HOST = 'sebsretina.local';
var PORT = 8000;


var clients = []; 

setInterval(heartbeat, 5000); 

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {
    clients.push(sock); 
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // Write the data back to the socket, the client will receive it as data from the server
        sock.write('echo from server : "' + data + '"');
        
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
		var index = clients.indexOf(sock); 
		if(index>-1) clients.splice(index,1); 
		sock.destroy();
    });

	sock.on('error', function() {
	    //id = socket2id.get(socket);
	    console.log('socket:timeout');
	    var index = clients.indexOf(sock); 
		if(index>-1) clients.splice(index,1);
	    sock.destroy();
	});
    
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

function heartbeat() { 
	for(var i = 0; i<clients.length; i++) { 
		var client = clients[i]; 
		console.log(client);
		client.write(" * "+Date.now()); 
		console.log("sending heartbeat "+i+" " +Date.now()); 
	}	
}