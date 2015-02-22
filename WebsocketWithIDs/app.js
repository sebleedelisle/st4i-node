
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
    //if (from!=client){
      client.send(msg);
    //}
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
			
			// a new client is registering its id with us
			
			client.id = json.id; 
			console.log('registering new id ', client.id); 
			
			// so we go through all the connections

			connections.forEach(function (sourceclient) {

				if((sourceclient!=client)&&(sourceclient.id)) {

					// and send all the existing clients the new id

					console.log('sending ', sourceclient.id, ' to ', client.id); 
					client.send(JSON.stringify({'type':'register', 'id':sourceclient.id}));
					
					// and send the new client to all the other ids
					sourceclient.send(JSON.stringify({'type':'register', 'id': client.id})); 
	
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
