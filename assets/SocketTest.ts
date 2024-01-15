import { _decorator, Component, Node, Socket, Vec3, instantiate, director } from 'cc';
// import {io} from 'socket'
// import {io} from 'scripts/socket.io'
// import {io} from 'socket.io-client'
// import {io} from 'socket.io'
// import io from 'socket.io-client/dist/socket.io.js'
// import {io} from 'socket.io-client/dist/socket.io'
import io from 'socket.io-client/dist/socket.io.js';
const { ccclass, property } = _decorator;

@ccclass('SocketTest')
export class SocketTest extends Component {
    socket=null;
    static instance:SocketTest=null;

    onLoad(){
        console.log("onload")
        if(!SocketTest.instance){
            SocketTest.instance=this;
        }
        // return SocketTest.instance;
    }
    /**
     * 单例
     */
    // public static getInstance():SocketTest {
        
    // }

    start() {
        // 连接服务器
        // declare module 'socket.io-client/dist/socket.io.js
        console.log(111);
        // return;
        // console.log("com",this.node.getChildByName("SpriteSplash"))
        console.log("io",io);
        // let sp=this.node.getChildByName("SpriteSplash");
        // sp.setPosition(new Vec3(150))

        // instantiate()
        // return;

        // this.socket = io.connect('http://localhost:4001');

        // this.socket = io("http://localhost:3005",
        // {
        //     withCredentials: true,
        //     extraHeaders: {
        //         "my-custom-header": "abcd"
        //     },
        //     transports: ['websocket', 'polling', 'flashsocket']
        // });
        // console.log(window.io)
        this.socket=io('http://localhost:4001');
        console.log('2222')

        // 判断是否连接成功
        
        this.socket.on('connect', (data: any) => {
        
            console.log('连接成功 发送user');
            this.socket.emit("CONNECT", {//"match"
                // type: this.input1.text,
                user: "socket1"
            });
            
            // 给服务器发消息
            
            // this.socket.emit('message', '你好');
            
        
            
            // 客户端接受消息
            
            this.socket.on('message', (data: any) => {
            
                console.log(data);
            
            });

            this.socket.on("ROOM",(data: any) => {
                this.onSocketHandle(data);
              });
            this.socket.on("GAME",(data: any) => {
                this.onSocketHandle(data);
              });
        
        });
        
        
        // 判断是否断开
        
        this.socket.on('disconnect', (data: any) => {
            console.log("disconnect断开socket")
        
        });

         // 连接错误
         this.socket.on("connect_error", (err: any) => {
            console.log("连接错误-connect_error:", err);
        });
        // 连接超时
        this.socket.on("connect_timeout", (data: any) => {
            console.log("连接超时-connect_timeout", data);
        });
        
    }

    changeScene(){
        director.loadScene("game");
        console.log("changeScene>>",this.node.isValid)
    }

    // destroy():boolean {
    //     super.destroy();
    //     console.log("销毁？？？");
    //     return true;
    // }
    onDestroy(){
        console.log("socket destroy",this.enabled,this.socket.id);
        // this.scheduleOnce(this.test1,10);
        this.scheduleOnce((data: any) => {console.log("this.socket",this.enabled)},2)
    }
    test1(){
        console.log('test111')
    }

    onSocketHandle(data:any){
        console.log("收到1消息",data);
        if(data.type=="match_success") {
            //this.input1.text="0";
            console.log('匹配成功')
        }
    }
    update(deltaTime: number) {
        
    }
}


