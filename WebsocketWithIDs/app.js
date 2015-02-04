
// websocket example with IDs - clients can broadcast to all other clients
// any data will just get forwarded on.

var connect = require('connect'), 
	ws = require('websocket.io'), 
	connections = [],
	lastID = Date.now();

var app = connect(); 

app.use(connect.static(__dirname+'/public'));
app.listen(8102); 

function broadcast(from, msg) {
  if(msg.length>1000) return; 
  connections.forEach(function (client) {
//    if ((from!=client) && ((!client.group) || (client.group==from.group))){
      client.send(msg);
//    }
  });
}

ws.attach(app).on('connection', function(client){

	client.send(JSON.stringify({type:'connect'})); 
	
	console.log('connected'); 
	//console.log(client); 
	
	// // generate a unique ID for the client
	// client.id = Date.now(); 
	// // just in case another client already joined less than a mil ago!
	// while(client.id<=lastID) client.id++;
	// lastID = client.id; 
	
	

	connections.push(client); 
	
	client.on('message', function(msg) { 
		
		console.log(msg); 
		
		broadcast(client, msg);
		
		try{
			var json = JSON.parse(msg); 
		} catch(e) {
			console.log('invalid message : '+e); 
			return;
		}	
		if(json.type == 'register') { 
			
			// a new client is registering its group with us
			
			client.group = json.group; 
			console.log('registering new group ', client.group); 
			
			// so we go through all the connections

			connections.forEach(function (sourceclient) {

				if((sourceclient!=client)&&(sourceclient.group)) {

					// and send all the existing clients the new group

					console.log('sending ', sourceclient.group, ' to ', client.group); 
					client.send(JSON.stringify({'type':'register', 'group':sourceclient.group}));
					
					// and send the new client to all the other groups
					sourceclient.send(JSON.stringify({'type':'register', 'group': client.group})); 
	
				}
			});
		}
			
		
		
	});
	
	client.on('close', function() { 
	
		console.log('disconnected'); 
		deleteConnection(client); 
	
	});
	
	client.on('error', function() { 
		
		console.log('ERROR!'); 
	    deleteConnection(client); 
	}); 
	
	
}); 

function deleteConnection(client) { 
	var i = connections.indexOf(client);
    // remove the cached connection
    if (i !== -1) {
      connections.splice(i, 1);
	}
}
