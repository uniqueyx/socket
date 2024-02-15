// import { _decorator, Component, Node } from 'cc';
// const { ccclass, property } = _decorator;

import Singleton from "./Singleton";
import io from 'socket.io-client/dist/socket.io.js'
import GameEvent from "./GameEvent";
import Toast from "./Toast";
import GameConfig from "./GameConfig";
import { director, sys } from "cc";
// import io from 'socket.io/client-dist/socket.io.js'

// @ccclass('SocketIO')
export class SocketIO extends Singleton {
    socket=null;
    userID=null;
    // tryTime:number;
    static get Instance() {
        return super.GetInstance<SocketIO>();
    }
    constructor() {
        super();
        console.log('init socket1')
        this.socket=io(GameConfig.IP+':3005');//http://localhost:3005   192.168.101.8:3005    192.168.2.152:3005
        console.log('init socket')
        // this.tryTime=0;
        this.socket.on('connect', (data: any) => {
            if(this.userID==null)   this.userID=GameConfig.USER_DATA.uid;
            console.log(this.userID,'连接成功 发送user',this.socket.id);
            // console.log("this.socket>>>",this.socket);//测试用
            this.socket.emit("CONNECT", {//"match"
                // type: this.input1.text,
                user: this.userID
            });
            GameEvent.Instance.emit("connected",data);
        });

        this.socket.on('message', (data: any) => {
            
            console.log(data);
        
        });

        this.socket.on("USER",(data: any) => {
            this.onSocketHandle(data);
        });
        this.socket.on("CARD",(data: any) => {
            this.onSocketHandle(data);
        });
        this.socket.on("ARENA",(data: any) => {
            this.onSocketHandle(data);
        });  
        this.socket.on("LOGIN",(data: any) => {
            this.onSocketHandle(data);
        });  
        this.socket.on("ROOM",(data: any) => {
            this.onSocketHandle(data);
        });
        this.socket.on("GAME",(data: any) => {
            this.onSocketHandle(data);
        });
        this.socket.on("ERROR",(data: any) => {
            this.onSocketHandle(data);
        });
        
        // 判断是否断开
        this.socket.on('disconnect', (data: any) => {
            console.log("disconnect断开socket")
            GameEvent.Instance.emit("disconnect",data);
        });

         // 连接错误
         this.socket.on("connect_error", (err: any) => {
            console.log("连接错误-connect_error:", err);
            GameEvent.Instance.emit("connect_error",err);
            // Toast.toast("连接服务器失败！尝试自动重连中...");
            // this.tryTime++;
            // if(this.tryTime>5){
            //     this.tryTime=0;
            //     console.log("断开连接")
            //     this.socket.disconnect();
            // }
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
    //主动清除断开连接
    clear(){
        
    }

    test(){
        console.log('test');
    }
    onSocketHandle(data:any){
        console.log(this.socket.id,"收到服务器消息",data.type,data);
        GameEvent.Instance.emit(data.type,data);
        // GameEvent.Instance.emit("test");
        // console.log("发送完emit>>>>>");
        // director.loadScene()
        switch(data.type){
            case "login_repeat":
                Toast.alert("您的账号已在其他设备上登录！",false,()=>{
                    this.socket.disconnect();
                    this.userID=null;
                    director.loadScene("login");
                });
                break;
            case "common_error":
                Toast.toast(data.msg);
                // Toast.alert(data.msg,false,()=>{
                //     director.loadScene("hall");
                // });
                break;
            case "user_update":
                let obj={account:data.account,password:data.password,uid:data.uid,nick:data.nick,level:data.level,vip:data.vip};
                GameConfig.USER_DATA=obj;
                sys.localStorage.setItem("sgCardUser",JSON.stringify(obj));
                console.log("玩家信息更新！")
                break;
        }
    }
}


