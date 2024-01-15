/*
	 * @Descripttion:
	 * @version:
	 * @Author: dex
	 * @Date: 2021-01-21 18:01
	 * @LastEditors: dex
	 * @LastEditTime: 2021-01-30 18:45
	 */
	const app = require("express")();
	var http = require("http").createServer(app);
	var socket = require("socket.io")(http, {
	  //allowEIO3: true,
	  cors: {
	    //origin: ['http://localhost:7456', 'http://localhost:7457','http://localhost:7458'],
	    //origin: ['http://localhost:7456'],
	    origin:'*',
	    //methods: ["GET", "POST"]
          	    //methods: ["GET", "POST"],
	    //credentials: true
	    //credentials: true
	  }
	});
	app.get("/", function (req, res) {
	  res.send("<h1>你好web秀</h1>");
	});
	//设置跨域访问
/*
	app.all("*", function (req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	  res.header("X-Powered-By", " 3.2.1");
	  res.header("Content-Type", "application/json;charset=utf-8");
	  next();
	});
*/	
	// socket.on("connect", function (socket) {
	//   console.log("conneted ...", socket);
	// });
	
	// 监听客户端连接
	socket.on("connection", function (socket) {
	  console.log("客户端有连接");
	  socket.on("connect", () => {
	    console.log("客户端开始连接");
	  });
	  // 监听客户端断开
	  socket.on("disconnect", () => {
	    console.log("客户端断开");
	  });
	
	  // 给客户端发送消息
	  socket.emit("welcome", "欢迎连接socket");
	
	  // 监听客户端消息
	  socket.on("hello", (data) => {
	    console.log("接收客户端发送数据", data);
	  });
	});
	// 启动服务器  监听 8088 端口
	http.listen(3005, function () {
	  console.log("server runing at 127.0.0.1:3005");
	});