const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
app.use(cors());//跨域
const server = http.createServer(app);
const {
	Server
} = require("socket.io");
const io = new Server(server);
 
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});
 
io.on('connection', (socket) => {
	socket.broadcast.emit('hi');
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		console.log('message: ' + msg);
		io.emit('chat message', 'server'+msg);
	});
});
 
server.listen(3005, () => {
	console.log('listening on *:3005');
	io.emit('login', '欢迎欢迎1');
});