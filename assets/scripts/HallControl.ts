import { _decorator, Component, Node, resources, JsonAsset, director, sys, Prefab, instantiate, NodeEventType, Label, EventTouch, tween, Tween, Vec3 } from 'cc';
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
    // @property(Prefab)
    // Alert:Prefab;

    socketIO=null;
    dotCount:number;

    onLoad(){
        this.loadData();

        GameEvent.Instance.on("match_error",this.reqMatchError,this);
        GameEvent.Instance.on("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.on("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.on("match_cancel",this.reqMatchCancel,this);
        GameEvent.Instance.on("game_return",this.reqGameReturn,this);
        GameEvent.Instance.on("login_repeat",this.reqLoginRepeat,this);

        GameEvent.Instance.on("connected",this.reqConnected,this);
        GameEvent.Instance.on("connect_error",this.reqConnectError,this);
        // this.socketIO=SocketIO.Instance;
        this.node.getChildByName("LeftTop").getChildByName("ImgHelp").on(NodeEventType.TOUCH_END,this.onBtHelp,this);
        
        //"prefab/Explosion"
        // await Promise.all([this.loadRes(), this.connectServer()]);
        return;
        if(GameConfig.IP=="http://localhost"){
            for(let i=0;i<3;i++){
                this.node.getChildByName("bg1").getChildByName("BtTest"+(i+1)).active=true;
            }
        }else{
            for(let i=0;i<3;i++){
                this.node.getChildByName("bg1").getChildByName("BtTest"+(i+1)).active=false;
            }
        }
    }
    // async loadRes() {
    //     const list = [];
    //     for (const type in PrefabPathEnum) {
    //       const p = ResourceManager.Instance.loadRes(PrefabPathEnum[type], Prefab).then((prefab) => {
    //         DataManager.Instance.prefabMap.set(type, prefab);
    //       });
    //       list.push(p);
    //     }
    //     for (const type in TexturePathEnum) {
    //       const p = ResourceManager.Instance.loadDir(TexturePathEnum[type], SpriteFrame).then((spriteFrames) => {
    //         DataManager.Instance.textureMap.set(type, spriteFrames);
    //       });
    //       list.push(p);
    //     }
    //     await Promise.all(list);
    //   }
    
    //   async connectServer() {
    //     if (!(await NetworkManager.Instance.connect().catch(() => false))) {
    //       await new Promise((resolve) => setTimeout(resolve, 1000));
    //       await this.connectServer();
    //     }
    //   }
    onDestroy(){
        GameEvent.Instance.off("match_error",this.reqMatchError,this);
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
        if(this.socketIO.socket.connected){
            this.socketIO.socket.emit("ROOM", {
                type: "match_cancel",
                user: this.socketIO.userID
            });
        }else this.node.getChildByName("MatchMask").active=false;
        
    }

    onBtArena(){
        // Toast.alert("测试alert",true,()=>{this.onBtEditCard()})
        // return;//测试代码

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
    onBtDungeon(){
        AudioManager.inst.playOneShot("audio/bt_big");
        director.loadScene("dungeon");
    }
    //帮助按钮
    onBtHelp(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        this.node.getChildByName("UIHelp").active=true;
    }
    onBtHelpConfirm(){
        AudioManager.inst.playOneShot("audio/bt_back");
        this.node.getChildByName("UIHelp").active=false;
    }
    //测试按钮
    onBtTest(e:EventTouch, param:string){
        console.log("测试按钮", param);
        // this.node.getComponent()
        let testObj=this.node.getChildByName("LeftTop").getChildByName("ImgHelp");
        if(param=="0"){
            testObj.setPosition(40,-40);
            tween(testObj).to(3,{position:new Vec3(testObj.position.x+500,testObj.position.y) }).
            call(() => { 
                //更新卡组数量
                AudioManager.inst.playOneShot("audio/bt_middle");
                console.log("触发 测试回调")
            }).
            start();
        }else if(param=="1"){
            Tween.stopAllByTarget(testObj);//移除 例如攻击tween
        }else if(param=="2"){
            // Tween.stopAllByTarget(testObj);//移除 例如攻击tween
        }


    }
    //============================服务器消息事件处理
    reqMatchError(data:unknown){
        Toast.toast("先点击编辑卡组新建或启用匹配卡组！");
    }
    reqMatchSuccess(data:unknown){
        console.log("服务器匹配成功事件 切换场景 游戏开始",data);
        director.loadScene("game");
    }
    reqMatchWait(data:unknown){
        console.log("服务器事件 matchwait",data);
        this.node.getChildByName("MatchMask").active=true;
        this.dotCount=0;
        this.node.getChildByName("MatchMask").getChildByName("Label").getComponent(Label).string='正在匹配对手 请您耐心等待';
        this.schedule(this.updateLbWait,0.5);
    }
    updateLbWait(){
        // console.log("this.dotCount",this.dotCount)
        let lb=this.node.getChildByName("MatchMask").getChildByName("Label").getComponent(Label);
        // lb.string=String(this.countDownTime);
        let str = '正在匹配对手 请您耐心等待';  
        let dotCount = this.dotCount || 0;  
        // 根据 dotCount 的值添加点号  
        for (let i = 0; i < dotCount; i++) {  
            str += '.';  
        }  
        // 更新 label 的文本  
        lb.string = str;  
        // 更新 dotCount 的值，使其在 0 到 3 之间循环  
        dotCount = (dotCount + 1) % 4;  
        this.dotCount = dotCount;  
    }
    reqMatchCancel(data:unknown){
        console.log("服务器事件 matchCancel",data);
        this.node.getChildByName("MatchMask").active=false;
        this.unschedule(this.updateLbWait);
    }
    reqGameReturn(data:unknown){
        console.log("服务器事件 重连返回游戏",data);
        director.loadScene("game");
    }
    //重复登录
    reqLoginRepeat(data:unknown){
        console.log("服务器事件 重复登录",data);
        // let al= instantiate(this.Alert);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show("您的账号已在其他地方登录！",false,()=>{
        //     this.socketIO.socket.disconnect();
        //     this.socketIO.userID=null;
        //     director.loadScene("login");
        // });
        // al.setParent(this.node);
        // Toast.alert("您的账号已在其他地方登录！",false,()=>{
        //     this.socketIO.socket.disconnect();
        //     this.socketIO.userID=null;
        //     director.loadScene("login");
        // });
    }

    //连接成功
    reqConnected(data:unknown){
        console.log("socket连接成功");
        this.node.getChildByName("NodeConnect").active=false;
        Toast.alertHide();
        // if(this.node.getChildByName("Alert"))    this.node.getChildByName("Alert").active=false;
    }
    //socket错误
    reqConnectError(data:unknown){
        this.node.getChildByName("NodeConnect").active=true;
        this.node.getChildByName("MatchMask").active=false;
        this.unschedule(this.updateLbWait);
    }
}


