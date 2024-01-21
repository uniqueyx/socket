// import { _decorator, Component, Node } from 'cc';
// const { ccclass, property } = _decorator;

import Singleton from "./Singleton";
import io from 'socket.io-client/dist/socket.io.js'
import GameEvent from "./GameEvent";
import Toast from "./Toast";
// import io from 'socket.io/client-dist/socket.io.js'

// @ccclass('SocketIO')
export class SocketIO extends Singleton {
    socket=null;
    userID=null;
    static get Instance() {
        return super.GetInstance<SocketIO>();
    }
    constructor() {
        super();
        console.log('init socket1')
        this.socket=io('192.168.101.8:3005');//http://localhost:3005   192.168.101.8:3005    192.168.2.152:3005
        console.log('init socket')

        this.socket.on('connect', (data: any) => {
            if(this.userID==null)   this.userID=this.socket.id;
            console.log(this.userID,'连接成功 发送user',this.socket.id);
            this.socket.emit("CONNECT", {//"match"
                // type: this.input1.text,
                user: this.userID
            });
            
            
        
        });

        this.socket.on('message', (data: any) => {
            
            console.log(data);
        
        });

        this.socket.on("ROOM",(data: any) => {
            this.onSocketHandle(data);
          });
        this.socket.on("GAME",(data: any) => {
            this.onSocketHandle(data);
          });

        // 判断是否断开
        this.socket.on('disconnect', (data: any) => {
            console.log("disconnect断开socket")
        
        });

         // 连接错误
         this.socket.on("connect_error", (err: any) => {
            console.log("连接错误-connect_error:", err);
            Toast.toast("连接服务器失败！尝试自动重连中...");
        });
        // 连接超时
        this.socket.on("connect_timeout", (data: any) => {
            console.log("连接超时-connect_timeout", data);
        });
    }

    connect(){
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    }

    test(){
        console.log('test');
    }
    onSocketHandle(data:any){
        console.log(this.socket.id,"收到服务器消息",data.type,data);
        GameEvent.Instance.emit(data.type,data);
        // GameEvent.Instance.emit("test");
        // console.log("发送完emit>>>>>");
        switch(data.type){
            case "match_success":
                console.log('匹配成功');
                break;
            case "game_start":
                console.log('游戏开始');
                break;
        }
    }
}


