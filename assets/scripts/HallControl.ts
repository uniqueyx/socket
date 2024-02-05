import { _decorator, Component, Node, resources, JsonAsset, director, sys, Prefab, instantiate } from 'cc';
import GameConfig from './Base/GameConfig';
import GameEvent from './Base/GameEvent';
import { SocketIO } from './Base/SocketIO';
import Toast from './Base/Toast';
import { ArenaControl } from './Game/ArenaControl';
import { AlertControl } from './Common/AlertControl';
import { AudioManager } from './Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('HallControl')
export class HallControl extends Component {
    @property(Prefab)
    Alert:Prefab;

    socketIO=null;

    onLoad(){
        this.loadData();

        GameEvent.Instance.on("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.on("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.on("match_cancel",this.reqMatchCancel,this);
        GameEvent.Instance.on("game_return",this.reqGameReturn,this);
        GameEvent.Instance.on("login_repeat",this.reqLoginRepeat,this);

        GameEvent.Instance.on("connected",this.reqConnected,this);
        GameEvent.Instance.on("connect_error",this.reqConnectError,this);
        // this.socketIO=SocketIO.Instance;

        
    }
    onDestroy(){
        GameEvent.Instance.off("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.off("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.off("match_cancel",this.reqMatchCancel,this);
        GameEvent.Instance.off("game_return",this.reqGameReturn,this);
        GameEvent.Instance.off("login_repeat",this.reqLoginRepeat,this);

        GameEvent.Instance.off("connected",this.reqConnected,this);
        GameEvent.Instance.off("connect_error",this.reqConnectError,this);
    }
    start() {
        console.log("hallcontrol  start",this.socketIO)
        this.socketIO=SocketIO.Instance;
        if(!this.socketIO.socket.connected) this.socketIO.socket.connect();
        this.node.getChildByName("UIArena").active=false;
    }

    update(deltaTime: number) {
        
    }
    //方法
    loadData(){
        if(!GameConfig.USER_DATA){
            let dataStorage=JSON.parse(sys.localStorage.getItem("sgCardUser"));
            console.log("dataStorage>>",dataStorage);
            if(dataStorage){
              GameConfig.USER_DATA=dataStorage;
            }
        }
        
        if(GameConfig.CARD_DATA) return;
        console.log("loadData>> 卡牌数据sg.json");
        resources.load('./json/sg', (err: any, res: JsonAsset) => {
            if (err) {
                console.log(err.message || err);
                return;
            }
            // 获取到 Json 数据
            const jsonData: object = res.json;//res.json!;
            GameConfig.CARD_DATA=res.json;
            // GameConfig.getCardDataById();
            console.log(typeof res.json,"res>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",res.json.length);
        })
    }
    //绑定的按钮事件
    onBtMatch(e: Event){
        // console.log(this.socketIO,e.target,e.CustomEventData ,typeof(e.currentTarget))
        // if(this.socketIO.socket)    console.log("socket连接",this.socketIO.socket.connected,this.socketIO.socket)
        AudioManager.inst.playOneShot("audio/bt_big");
        if(!this.socketIO||!this.socketIO.socket) {
            console.log('socket不存在')
            return;
        }    
        if(!this.socketIO.socket.connected){
            Toast.toast("服务器连接失败！");
            return;
        }
        this.socketIO.socket.emit("ROOM", {
            type: "match_room",
            gameType:2,
            user: this.socketIO.userID
        });

    }

    onBtMatchCancel(){
        console.log("取消匹配");
        AudioManager.inst.playOneShot("audio/bt_back");
        this.socketIO.socket.emit("ROOM", {
            type: "match_cancel",
            user: this.socketIO.userID
        });
    }

    onBtArena(){
        AudioManager.inst.playOneShot("audio/bt_big");
        if(!this.socketIO.socket.connected){
            Toast.toast("服务器连接失败！");
            return;
        }
        this.node.getChildByName("UIArena").getComponent(ArenaControl).getInfo();
        this.node.getChildByName("UIArena").active=true;
        // Toast.toast("功能开发中");
    }
    onBtEditCard(){
        AudioManager.inst.playOneShot("audio/bt_big");
        console.log(this.socketIO.socket.connected);
        // this.socketIO.socket.disconnect();
        // console.log(this.socketIO.socket.connected);
        // Toast.toast("功能开发中");
        director.loadScene("cardEdit");
    }


    //服务器消息事件处理
    reqMatchSuccess(data:unknown){
        console.log("服务器匹配成功事件 切换场景 游戏开始",data);
        director.loadScene("game");
    }
    reqMatchWait(data:unknown){
        console.log("服务器事件 matchwait",data);
        this.node.getChildByName("MatchMask").active=true;
    }
    reqMatchCancel(data:unknown){
        console.log("服务器事件 matchCancel",data);
        this.node.getChildByName("MatchMask").active=false;
    }
    reqGameReturn(data:unknown){
        console.log("服务器事件 重连返回游戏",data);
        director.loadScene("game");
    }
    //重复登录
    reqLoginRepeat(data:unknown){
        console.log("服务器事件 重复登录",data);
        let al= instantiate(this.Alert);
        let aControl=al.getComponent(AlertControl);
        aControl.show("您的账号已在其他地方登录！",false,()=>{
            this.socketIO.socket.disconnect();
            this.socketIO.userID=null;
            director.loadScene("login");
        });
        al.setParent(this.node);
    }

    //连接成功
    reqConnected(data:unknown){
        console.log("socket连接成功");
        this.node.getChildByName("LbConnect").active=false;
    }
    //socket错误
    reqConnectError(data:unknown){
        this.node.getChildByName("LbConnect").active=true;
    }
}


