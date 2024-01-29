import { _decorator, Component, Node, resources, JsonAsset, director, sys } from 'cc';
import GameConfig from './Base/GameConfig';
import GameEvent from './Base/GameEvent';
import { SocketIO } from './Base/SocketIO';
import Toast from './Base/Toast';
const { ccclass, property } = _decorator;

@ccclass('HallControl')
export class HallControl extends Component {

    socketIO=null;

    onLoad(){
        this.loadData();

        GameEvent.Instance.on("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.on("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.on("match_cancel",this.reqMatchCancel,this);
        GameEvent.Instance.on("game_return",this.reqGameReturn,this);
        this.socketIO=SocketIO.Instance;
    }
    onDestroy(){
        GameEvent.Instance.off("match_success",this.reqMatchSuccess,this);
        GameEvent.Instance.off("match_wait",this.reqMatchWait,this);
        GameEvent.Instance.off("match_cancel",this.reqMatchCancel,this);
        GameEvent.Instance.off("game_return",this.reqGameReturn,this);
    }
    start() {

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
        this.socketIO.socket.emit("ROOM", {
            type: "match_cancel",
            user: this.socketIO.userID
        });
    }

    onBtArena(){
        Toast.toast("功能开发中");
    }
    onBtEditCard(){
        Toast.toast("功能开发中");
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
}


