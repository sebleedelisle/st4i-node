
// websocket example with IDs - clients can broadcast to all other clients
// any data will just get forwarded on.
var http = require("http"),
    url = require("url"),
    Deserializer = require("xmlrpc/lib/deserializer"),
    Serializer = require("xmlrpc/lib/serializer"),
    querystring = require("querystring");



var connect = require('connect'), 
	ws = require('websocket.io'), 
	connections = [],
	lastID = Date.now();

var app = connect(); 

app.use(connect.static(__dirname+'/public'));
app.listen(8103); 



var server = http.createServer(function (request, response) {
  
  //console.log(request);
  var deserializer = new Deserializer();
  
  deserializer.deserializeMethodCall(request, function(error, methodName, params) {
    var statusCode = 200, xml = Serializer.serializeMethodResponse(Date.now().toString(32));;
    if (!error) {
  
      console.log("deserialized:", methodName, params,"\n");
  
  
      switch (methodName) {
  
        case 'mt.supportedMethods': // codex.wordpress.org/XML-RPC_MovableType_API#mt.supportedMethods
          // this is used by IFTTT to verify the site is actually a wordpress blog ;-)
          xml = Serializer.serializeMethodResponse(['metaWeblog.getRecentPosts', 'metaWeblog.newPost']);
          break;
  
        case 'metaWeblog.getRecentPosts': // codex.wordpress.org/XML-RPC_MetaWeblog_API#metaWeblog.getRecentPosts
          // this is the authentication request from IFTTT
          // send a blank blog response
          // this also makes sure that the channel is never triggered
          xml = Serializer.serializeMethodResponse([]);
          break;
  
        case 'metaWeblog.newPost': // codex.wordpress.org/XML-RPC_WordPress_API/Posts#wp.newPost

          // This is the actual webhook.  Parameters are provided via fields in IFTTT's GUI.  By convention
          // we put the target URL in the Tags field (passed as mt_keywords).  e.g. params
          // [0, "user", "password", {"title":"...","description":"...","categories":[...],mt_keywords":[webhook url]}]

          //params.shift();  // blogid? 

   
           var params = params[3];
           
           console.log(params);
           console.log(params.description); 
           console.log('---------------------');

           var msg = {type:'message', data:params.description};    
           broadcast(null, JSON.stringify(msg));
          xml = Serializer.serializeMethodResponse(Date.now().toString(32)); // a "postid", presumably ignored by IFTTT
          break;
        default:
          error = { faultCode: -32601, faultString: "server error. requested method not found" };
          break;
      }
    }
    if (error) {
      xml = Serializer.serializeFault(error);
    }
	// write response back to API call from IfTTT
	console.log(xml);
    response.writeHead(statusCode, {'Content-Type': 'text/xml', 'Content-Length': xml.length});
    response.end(xml);
  });
});

server.once("listening", function () {
  console.log("listening on port %d", server.address().port);
});

server.listen(process.env.PORT || 80);



function broadcast(from, msg) {
  console.log("sending", msg);
  connections.forEach(function (client) {
    if ((from !== client)){
      client.send(msg);
	}
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
		
		broadcast(null, msg);
		
		try{
			var json = JSON.parse(msg); 
		} catch(e) {
			console.log('invalid message : '+e); 
			return;
		}	
		if(json.type == 'register') { 
			client.id = json.id; 
			
			connections.forEach(function (sourceclient) {
				if((sourceclient!=client)&&(sourceclient.id))
					client.send(JSON.stringify({'type':'register', 'id':sourceclient.id}));	
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
