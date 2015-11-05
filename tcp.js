var net = require('net'), //import net object
	carrier = require('carrier'), //import carrier object
    serverOption = { //custom options for server when connected
        allowHalfOpen: false,
        pauseOnConnect:false
    },
    clients = [], //array will hold client as the sign on
    rooms = { //object of arrays which will hold client object keep track where they will be located
        chat: [],
        hottub: []
    },
    localizeArr = [ //array hard coded messaged to display
       'Welcome to the GungHo test chat server',
       'Login Name?',
       'Sorry, name taken.',
       'BYE',
       'Welcome',
       'Active rooms are:',
       '*chat',
       '*hottub',
       'end of list.',
       'entering room: chat',
       '(** this is you)',
       'sorry already joined a chat.',
       '* user has left chat:',
       '* new user joined chat:'
    ];
/*
 * Method: authenticate
 * Param: string
 * Description: check string name doesnt match any existing
 */
function authenticate(l) {
	for (var i = 0; i < clients.length; i++) { //loop through all clients
		if (clients[i].chatGungHo.name === l) return false; //if match already connected user
	    else return true;
	}
}

/*
 * Method: roomRoute
 * Param: object
 * Description: send client status of rooms
 */
function roomRoute(s) {
    s.write('\r\n' + localizeArr[5] + '\r\n'); //send message to client
    s.write(localizeArr[6] + '(' + rooms.chat.length + ')\r\n'); //count clients in chat
    s.write(localizeArr[7] + '(' + rooms.hottub.length + ')\r\n'); //count client in hottub
    s.write(localizeArr[8] + '\r\n'); //send message to client
}

/*
 * Method: chatRoute
 * Param: object
 * Description: setup client in chat room
 */
function chatRoute(s) {
	var my_carrier = carrier.carry(s); //instance carrier
    s.write('\r\n' + localizeArr[9] + '\r\n'); //send message to client
    rooms.chat.push(s); //push client to chat array
    for (var i = 0; i < rooms.chat.length; i++) { //loop through chat array
        if (rooms.chat[i].chatGungHo.id === s.chatGungHo.id) { //check client match by id
        	rooms.chat[i].write(rooms.chat[i].chatGungHo.name + localizeArr[10] + '\r\n'); //send message to client
        	rooms.chat[i].write(localizeArr[8] + '\r\n\r\n'); //send message to client
        }else{
        	s.write(rooms.chat[i].chatGungHo.name + '\r\n');
        	rooms.chat[i].write(localizeArr[13] + s.chatGungHo.name + '\r\n'); //send message inform other client
        }
    }
    /*
     * Method line
     * Param: string
     * Description: Fired when client send new line
     */
    my_carrier.on('line',  function(line) {
        broadcast(s, s.chatGungHo.name + ':' + line); //send line of string to other clients
    });
}
/*
 * Method: inputManager
 * Param: object
 * Description: attach new events to client
 */
function inputManager(s) {
    var my_carrier = carrier.carry(s); //instance carrier
    /*
     * Method: line
     * Param: string
     * Description: Fired by carrier when client send new line
     */
	my_carrier.on('line',  function(line) { //Handle incoming msg from clients
        switch (line) { //check escape || route cmds
            case '/quit':
            		removeRoom(s); //remove client from room
	                closeSocket(s); //destroy properties
	                s.destroy(); //kill client
                break;
            case '/leave':
                broadcast(s, localizeArr[12] + s.chatGungHo.name + localizeArr[10] + '\r\n'); //last broadcast
                removeRoom(s); //remove client from room
                break;
            case '/rooms':
                roomRoute(s); //send client rooms settings
                break;
            case '/join chat':
                if (!s.chatGungHo.joined) { //check if client joined a chat already
                    s.chatGungHo.joined = true; //set property
                    s.chatGungHo.room = 'chat'; //set property
                    chatRoute(s); //send client chat settings
                } else {
                    s.write('\r\n' + localizeArr[11] + '\r\n'); //send client error message
                }
                break;
        }
    });
    /*
     * Method: end
     * Description: Fire by client when connection ended
     */
    s.on('end', function () {
        closeSocket(s); //desctroy properties
        s.destroy(); //kill client
    });
}
/*
 * Method: broadcast
 * Param: object, string
 * Description: loop through client and if not match send message
 */
function broadcast(s, d) {
	if(s.chatGungHo.room === 'chat'){ //check room match
	    rooms.chat.forEach(function (c) { //loop through client array
	        if (c.chatGungHo.id === s.chatGungHo.id) return; //if client ids match
	        c.write(d + '\r\n'); //send message to all other clients
	    });
	}
}
/*
 * Method: removeRoom
 * Param: object
 * Description: Check what room the client is in loop through room find matching id and remove from array
 */
function removeRoom(s){
	if(s.chatGungHo.room === 'chat'){ //check room match
	    for (var i = 0; i < rooms.chat.length; i++) { //loop through chat array
	    	if(rooms.chat[i].chatGungHo.id === s.chatGungHo.id){ //check were ids match
	    		rooms.chat.splice(rooms.chat[i], 1); //remove from array
	    		break; //escape loop
	    	}
	    }
	    for (var i = 0; i < clients.length; i++) { //loop through chat array
	    	if(clients[i].chatGungHo.id === s.chatGungHo.id){ //check were ids match
	    		clients[i].chatGungHo.joined = false; //set new value to property
	    		clients[i].chatGungHo.room = ''; //set new value to property
	    		break; //escape loop
	    	}
	    }
    }
}

/*
 * Method: closeSocket
 * Param: object
 * Description: Destroy any footprints client has
 */
function closeSocket(s) {
    s.write(localizeArr[3] + '\r\n'); //send message to client
    for (var i = 0; i < clients.length; i++) { //loop through clients
    	if(clients[i].chatGungHo.id === s.chatGungHo.id){ //compare iterated client to current
    		clients.splice(clients[i], 1); //remove client that match
    		break; //escape from loop
    	}
    }
}
/*
 * Method: newClient
 * Param: object
 * Description: setup client default properties
 */
function newClient(client) {
    client.chatGungHo = {}; //attach new object to client object
    client.chatGungHo.id = client.remoteAddress + ":" + client.remotePort; //concat remoteAddr + remotePort
    client.chatGungHo.name = ''; //set property but leave blank
    client.chatGungHo.room = ''; //set property but leave blank
    client.chatGungHo.joined = false; //set property to false
    client.chatGungHo.authenticated = false; //set property to false
    clients.push(client);  //Add new client to our existing list
}
/*
 * Method: userAuth
 * Param: object, string
 * Description: check client input matches any other client name based on that error or finish client setup and attach method
 */
function userAuth(s,l) {
	if (!authenticate(l)){ //send string to method and handle return value
        s.write('\r\n' + localizeArr[2] + '\r\n'); //send error to client
    } else {
        s.chatGungHo.authenticated = true; //set client property to true
        s.chatGungHo.name = l;//set client property to value
        s.write('\r\n' + localizeArr[4] + ' ' + s.chatGungHo.name + '!' + '\r\n'); //write message concat property
        inputManager(s); //attach method
    }
}
/*
 * Method: createServer
 * Param: object,callback
 * Description: Create server instance provide and custom options and callback
 */
var server = net.createServer(serverOption,newClient);
/*
 * Method:Connection
 * Param:object
 * Description: Fire by server object when successful connection
 */
server.on('connection', function (client) {
    var my_carrier = carrier.carry(client); //instance carrier object
    client.setEncoding('utf8'); //encoding setup
    client.setNoDelay(true); //disable the Nagle algorithm
    client.write(localizeArr[0] + '\r\n'); //welcome text
    client.write(localizeArr[1] + '\r\n'); //sign in text
    /*
     * Method:line
     * Param:string
     * Description: Fired by carrier when client send new line
     */
	my_carrier.on('line',  function(line) {
        if (!client.chatGungHo.authenticated){  //check user already sign in
            userAuth(client,line); //send new client authenticate
        }
	});
    /*
     * Method:end
     * Param:
     * Description: Fired by client not sending connection to server
     */
    client.on('end', function () {
        closeSocket(client); //send client object to method handle destroy footprints
    });
});

/*
 * Method: Error
 * Param: object
 * Description: Fire by server object when error detected
 */
server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') { //Check error code string matches
        setTimeout(function () { //settimeout for second let server attempt again for 1 sec then
            server.close(); //close out server
            //server.listen(PORT,HOST);
        },1000);
    }
});
server.listen(9399);//Specify server to Listen on port 9399