import { _decorator, Component, Node, director, Enum, Button, Label, Sprite, view, screen, UITransform, Widget, Vec3, Vec2, resources, JsonAsset, error, EventTouch, NodeEventType } from 'cc';
import GameConfig from './Base/GameConfig';
import GameEvent from './Base/GameEvent';
import { SocketIO } from './Base/SocketIO';
import Toast from './Base/Toast';
const { ccclass, property } = _decorator;

@ccclass('GameMenuControl')
export class GameMenuControl extends Component {

    // @property(Button)
    // btn: Button = null;
    @property(Sprite)
    bg:Sprite;

    socketIO=null;
    btMatch:Button;
    lbMatch:Label;
    matchMask:Sprite;
    onLoad(){

        this.loadData();

        GameEvent.Instance.on("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.on("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.on("match_cancel",this.reqMatchCancel,this);

        //触摸事件
        //.getParent()
        this.node.getParent().on(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.getParent().on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.getParent().on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
        // this.initSocket();
        console.log("step>>>>3");
        this.socketIO=SocketIO.Instance;
        // director.preloadScene("game");//预加载
        
        
        // this.socketIO=SocketIO.GetInstance();
        this.btMatch=this.node.getChildByName("BtMatch").getComponent(Button);
        this.lbMatch=this.node.getChildByName("BtMatch").getChildByName("Label").getComponent(Label);
        this.matchMask=this.node.getChildByName("MatchMask").getComponent(Sprite);
        let bgHiehgt=this.bg.getComponent(UITransform).contentSize;
        // this.node.getChildByName("BtMatch").setPosition(new Vec3(0,640))
        console.log(this.node.getParent().getChildByName("Background").getScale(),bgHiehgt,"高度",this.bg.getComponent(Widget).top);
        // this.bg.;
        // this.lbMatch
        
        // this.node.getChildByName("MatchMask").getChildByName("MatchMaskBg").
        // this.btMatch=this.node.getComponent(Button) ;
        console.log(screen,"222")
        console.log('test11',screen.windowSize)
        console.log( 'onload  gamemenucontrol',view.getVisibleSize() )
        console.log(view.getDesignResolutionSize(),"<<<bt" ,this.btMatch)
        console.log(this.node.name,this.btMatch instanceof Button,"this.socket",this.socketIO)
        
        // let titleNode = this.btn.node.getChildByName("Label");
        // titleNode.getComponent(Label).string = "按钮";
    }
    onDestroy(){
        GameEvent.Instance.off("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.off("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.off("match_cancel",this.reqMatchCancel,this);
    }

    loadData(){
        console.log("loadData>>");
        // resources.load('./json/sg', (err: any, res: any) => {
        //     console.log(typeof res.json,"res>>.",res)
        // })
        // return;   
        resources.load('./json/sg', (err: any, res: JsonAsset) => {
            if (err) {
                error(err.message || err);
                return;
            }
            // 获取到 Json 数据
            const jsonData: object = res.json;//res.json!;
            GameConfig.CARD_DATA=res.json;
            // GameConfig.getCardDataById();
            console.log(GameConfig.getCardDataById(10001),typeof res.json,"res>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",res.json.length);
        })
    }
    async initSocket(){
        console.log("step>>>>1");
        await SocketIO.Instance.connect();
        console.log("socket服务连接成功！ step2");
    }
    start() {
        console.log(this.socketIO,"GameMenuControl start<<  >>socketid")
    }

    update(deltaTime: number) {
        // Enum
    }

    //按钮方法
    onBtMatch(e: Event){
        // console.log(this.socketIO,e.target,e.CustomEventData ,typeof(e.currentTarget))
        console.log(this.lbMatch.string,"<<label");
        // this.node.getChildByName("MatchMask").active=true;
        if(!this.socketIO||!this.socketIO.socket) {
            console.log('socket未连接')
            return;
        }    
        
        this.socketIO.socket.emit("ROOM", {
            type: "match_room",
            user: this.socketIO.userID
        });

    }

    onBtMatchCancel(){
        console.log("取消匹配");
        // this.matchMask
        // this.node.getChildByName("MatchMask").active=false;
        this.socketIO.socket.emit("ROOM", {
            type: "match_cancel",
            user: this.socketIO.userID
        });
    }

    onGameStart(){
        console.log("切换场景 游戏开始111",this.node.getChildByName("BtGameStart").getSiblingIndex(),this.node.getChildByName("BtMatch").getSiblingIndex())
        // GameEvent.Instance.emit("test");
        // this.node.getSiblingIndex
        // this.node.getChildByName("BtGameStart").getSiblingIndex();
        let index=this.node.getChildByName("BtGameStart").getSiblingIndex();
        this.node.getChildByName("BtGameStart").setSiblingIndex(index?0:1);
        return;
        director.loadScene("game");
        
    }

    //触摸事件
    onTouchStart(e:EventTouch){
        return;
        console.log("《《《《《《《《《《《《《《《《测试触摸事件");
        let arrStr=["测试1111","测试2222222222","测试333333333332222","测试4444444444442244444"];
        let ranStr=arrStr[Math.floor(Math.random()*2)];
        Toast.showTip(ranStr,e.getUILocation());
        
    } 
    onTouchEnd(e:EventTouch){
        // Toast.hideTip();
    }
    onTouchCancel(e:EventTouch){
        // Toast.hideTip();
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
    
}


