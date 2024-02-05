import { _decorator, Component, EventTouch, Label, Node, NodeEventType, UITransform, Vec3 } from 'cc';
import GameConfig from '../Base/GameConfig';
import GameEvent from '../Base/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('CardItemControl')
export class CardItemControl extends Component {

    baseData:any;
    count:number;
    onLoad(){
        // console.log("<<<<<<<<<<init card");
        // this.node.on(NodeEventType.TOUCH_START,this.onTestTouchStart,this);
        // this.node.on(NodeEventType.TOUCH_MOVE,this.onTestTouchMove,this);
        // this.node.on(NodeEventType.TOUCH_END,this.onTestTouchEnd,this);
        // this.node.on(NodeEventType.TOUCH_CANCEL,this.onTestTouchCancel,this);
        
    }    
    start() {

    }

    update(deltaTime: number) {
        
    }

    initData(id:number,count:number,canTouch:boolean=true){
        console.log("initData",id,count);
        this.baseData=GameConfig.getCardDataById(id);
        this.count=count;

        this.node.getChildByName("LbName").getComponent(Label).color=GameConfig.COLOR_RARE[this.baseData.rare];
        this.node.getChildByName("LbName").getComponent(Label).string=this.baseData.cardName;

        this.node.getChildByName("LbCount").getComponent(Label).string=""+this.count;
        if(canTouch){
            this.node.getChildByName("Bg").on(NodeEventType.TOUCH_START,this.onTouchStart,this);
            this.node.getChildByName("Bg").on(NodeEventType.TOUCH_MOVE,this.onTouchMove,this);
            this.node.getChildByName("Bg").on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
            this.node.getChildByName("Bg").on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);

        }
    }

    changeCount(value:number){
        // let currentValue=parseInt(this.node.getChildByName("LbCount").getComponent(Label).string);
        this.count+=value;
        this.node.getChildByName("LbCount").getComponent(Label).string=""+this.count;
    }

    //事件
    onTouchStart(e:EventTouch){ 
        console.log("touch  card item");
        let uinode = this.node.getParent().getComponent(UITransform);
        // let touchPos=new Vec3(e.getUILocation().x,e.getUILocation().y);
        // console.log("onTouchCancel>>",uinode.convertToNodeSpaceAR(touchPos));
        // GameEvent.Instance.emit("cardItemTouch",{pos:uinode.convertToNodeSpaceAR(this.node.position),id:this.baseData.id,count:this.count});
        GameEvent.Instance.emit("cardItemTouch",{pos:uinode.convertToWorldSpaceAR(this.node.position),id:this.baseData.id,count:this.count});
    }
    onTouchMove(e:EventTouch){
        console.log("onTouchMove  card item");
        GameEvent.Instance.emit("cardItemEditTouchMove",{posX:e.getUIDelta().x,posY:e.getUIDelta().y,judgeRect:true});
    }
    onTouchEnd(e:EventTouch){
        console.log("onTouchEnd  card item");
        GameEvent.Instance.emit("cardItemEditTouchEnd",{});
    }
    onTouchCancel(e:EventTouch){
        console.log("cancel事件",this.count,this.baseData.id,this.baseData.cardName)
        GameEvent.Instance.emit("cardItemEditTouchCancel",{id:this.baseData?this.baseData.id:0});
    }


    //测试事件
    onTestTouchStart(e:EventTouch){ 
        console.log("testtouchstart+++++111");
    }
    onTestTouchMove(e:EventTouch){ 
        console.log("testtouchmove+++++222");
    }
    onTestTouchEnd(e:EventTouch){ 
        console.log("testtouchend+++++333");
    }
    onTestTouchCancel(e:EventTouch){ 
        console.log("testtouchcancel+++++444");
    }
}


