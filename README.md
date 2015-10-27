# Gungho Chat
This is just a test chat incomplete but what I was able to put together in 48 hrs
-----------------------------------------------------------------------------------------------------
#Technologies used
language: Javascript
runtime: node.js
#Bugs
- hottub not incomplete
- When a user broadcast to other clients only sends single chars buffer functionality not finished
- Notification when new user joins chat incomplete
- leave route incomplete

# Working features
-  escape char ^ 
- login 
- rooms route
- join chat route
- quit route
- display users in current chat
- distinguish current user
- distinguish user sending message

#setup locally 
- install nodejs and npm follow link : http://blog.teamtreehouse.com/install-node-js-npm-mac
- Telnet Client on Mac OS follow link: http://ananddrs.com/2014/09/23/enable-telnet-on-mac-os-x-mavericksricks/
- After node js and Telnet Client installed successfully point to directory which you installed git files through terminal and run command "node tcp.js"
- Now run Telnet client in another terminal and run command "telnet localhost 9399"