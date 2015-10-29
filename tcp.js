var net = require('net'),
	carrier = require('carrier'),
    serverOption = {
        allowHalfOpen: false,
        pauseOnConnect:false
    },
    clients = [],
    rooms = {
        chat: [],
        hottub: []
    },
    localizeArr = [
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
       '* user has left chat:'
    ];
/*
 * Method sign handling.
 */
function authenticate(s) {
    //check existing connected users
    for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        //if match already connected user
        if (client.chatGungHo.name === cleanInput(s.chatGungHo.buffer)) return false;
        else return true;
    };
}
 
/*
 * Method handle rooms route
 */
function roomRoute(s) {
    s.write('\r\n' + localizeArr[5] + '\r\n');
    s.write(localizeArr[6] + '(' + rooms.chat.length + ')\r\n');
    s.write(localizeArr[7] + '(' + rooms.hottub.length + ')\r\n');
    s.write(localizeArr[8] + '\r\n');
}

/*
 * Method handle chat route
 */
function chatRoute(s) {
	var my_carrier = carrier.carry(s);
	 
    s.write('\r\n' + localizeArr[9] + '\r\n');

    rooms.chat.push(s);

    for (var i = 0; i < rooms.chat.length; i++) {
        var client = rooms.chat[i];
        if (client.chatGungHo.id === s.chatGungHo.id) {
            client.write(client.chatGungHo.name + localizeArr[10] + '\r\n');
        } else {
            s.write(client.chatGungHo.name + '\r\n');
        }
    }

    s.write(localizeArr[8] + '\r\n');

    my_carrier.on('line',  function(line) {
        broadcast(s, s.chatGungHo.name + ':' + line);
    });
}

/*
 * Method Main menu
 */
function mainMenu(s,d) {
    //check escape || route cmds
    switch (cleanInput(d)) {
        case '^':
            //kill telnet client
            closeSocket(s);
            s.destroy();
            break;
    }
}


/*
 * Method attach listeners
 */
function attachListeners(s) {
    var my_carrier = carrier.carry(s),
        joined = false;
    //Handle incoming msg from clients
	my_carrier.on('line',  function(line) {
        //check escape || route cmds
        switch (cleanInput(line)) {
            case '/quit':
                //kill telnet client
                closeSocket(s);
                s.destroy();
                break;
            case '/leave':
                //last broadcast
                broadcast(s, localizeArr[12] + s.chatGungHo.name + localizeArr[10] + '\r\n');
                //kill telnet client
                closeSocket(s);
                s.destroy();
                break;
            case '/rooms':
                //send client rooms settings
                roomRoute(s);
                break;
            case '/join chat':
                if (!joined) {
                    joined = true;
                    //send client chat settings
                    chatRoute(s);
                } else {
                    s.write('\r\n' + localizeArr[11] + '\r\n');
                }
                break;
            case '/leave':
        }
    });

    //Handle remove the client from the list when it leaves
    s.on('end', function () {
        closeSocket(s);
    });
}

/*
 * Callback method exe when data is received from a socket
 */
function broadcast(s, d) {
    clients.forEach(function (c) {
        if (c === s) return;
        c.write(d + '\r\n');
    });
}

/*
 * Method exe when a socket ends
 */
function closeSocket(s) {
    s.write(localizeArr[3] + '\r\n');
    clients.splice(clients.indexOf(s), 1);
    s.chatGungHo.buffer = '';
}

/*
 * Callback method exe when a new TCP socket is opened.
 */
function newClient(client) {
    //App Settings
    client.chatGungHo = {};
    client.chatGungHo.id = client.remoteAddress + ":" + client.remotePort;
    client.chatGungHo.name = '';
    client.chatGungHo.authenticated = false;

    //Add new client to our existing list
    clients.push(client);
}

/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
    return data.toString().replace(/(\r\n|\n|\r)/gm, "");
}

/*
 * Timeout validate length & user finish input
 */
function userAuth(s) {
	if (!authenticate(s)) {
        s.write('\r\n' + localizeArr[2] + '\r\n');
    } else {
		s.chatGungHo.name = cleanInput(s.chatGungHo.buffer);
        s.chatGungHo.buffer = '';
        s.chatGungHo.authenticated = true;
        s.write('\r\n' + localizeArr[4] + ' ' + s.chatGungHo.name + '!' + '\r\n');
        attachListeners(s);
    }
}

/*
 * Create a new server and provide a callback for when a connection occurs
 */
var server = net.createServer(serverOption,newClient);

//Handle on connection
server.on('connection', function (client) {
    var my_carrier = carrier.carry(client);
    //encoding setup
    client.setEncoding('utf8');
    //disable the Nagle algorithm
    client.setNoDelay(true);
    //Add Client Buffer
    client.chatGungHo.buffer = '';
    //welcome text
    client.write(localizeArr[0] + '\r\n');
    //sign in text
    client.write(localizeArr[1] + '\r\n');
	
	my_carrier.on('line',  function(line) {
		//Add to client buffer
        client.chatGungHo.buffer += line;

        //Add main menu
        mainMenu(client,line);

        //check user already sign in
        if (!client.chatGungHo.authenticated) {
            userAuth(client);
        }
	});

    //Handle incoming msg from clients
    client.on('data', function (d) {
        
    });

    //Handle remove the client from the list when it leaves
    client.on('end', function () {
        closeSocket(client);
    });
});

//Handle on error
server.on('error', function (e) {
    //Handle error when same port
    if (e.code == 'EADDRINUSE') {
        //give it 1sec
        setTimeout(function () {
            //close out server
            server.close();
            //server.listen(PORT,HOST);
        },1000);
    }
});

//Listen on 9399 
server.listen(9399);