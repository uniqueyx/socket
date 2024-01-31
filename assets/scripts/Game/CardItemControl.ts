import { _decorator, Component, EventTouch, Label, Node, NodeEventType } from 'cc';
import GameConfig from '../Base/GameConfig';
import GameEvent from '../Base/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('CardItemControl')
export class CardItemControl extends Component {

    baseData:any;
    count:number;
    onLoad(){
        // console.log("<<<<<<<<<<init card");
        this.node.getChildByName("Bg").on(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.getChildByName("Bg").on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.getChildByName("Bg").on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
    }    
    start() {

    }

    update(deltaTime: number) {
        
    }

    initData(id:number,count:number){
        console.log("initData",id,count);
        this.baseData=GameConfig.getCardDataById(id);
        this.count=count;

        this.node.getChildByName("LbName").getComponent(Label).color=GameConfig.COLOR_RARE[this.baseData.rare];
        this.node.getChildByName("LbName").getComponent(Label).string=this.baseData.cardName;

        this.node.getChildByName("LbCount").getComponent(Label).string=""+this.count;
    }

    changeCount(value:number){
        // let currentValue=parseInt(this.node.getChildByName("LbCount").getComponent(Label).string);
        this.count+=value;
        this.node.getChildByName("LbCount").getComponent(Label).string=""+this.count;
    }

    //事件
    onTouchStart(e:EventTouch){ 
        console.log("touch  card item")
        GameEvent.Instance.emit("cardItemTouch",{id:this.baseData.id});
    }
    onTouchEnd(e:EventTouch){

    }
    onTouchCancel(e:EventTouch){

    }
}


