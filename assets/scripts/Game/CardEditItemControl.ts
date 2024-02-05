import { _decorator, Component, EventTouch, Label, Node, NodeEventType } from 'cc';
import GameEvent from '../Base/GameEvent';
import GameConfig from '../Base/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('CardEditItemControl')
export class CardEditItemControl extends Component {

    id:number;
    cardName:string;
    force:number;
    used:number;
    onLoad(){
        // console.log("<<<<<<<<<<init card");
        this.node.getChildByName("Bg").on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        
    }  

    start() {

    }

    update(deltaTime: number) {
        
    }

    initData(id:number,cardName:string,force:number,used:number){
        this.id=id;
        this.cardName=cardName;
        this.force=force;
        this.used=used;
        this.node.getChildByName("LbName").getComponent(Label).string=cardName;
        this.node.getChildByName("LbForce").getComponent(Label).string=GameConfig.FORCE_NAME[force];
        this.node.getChildByName("LbUse").active=this.used==1;
        this.node.getChildByName("BtUse").active=this.used!=1;

    }
    setUse(used:number){
        this.used=used;
        this.node.getChildByName("LbUse").active=this.used==1;
        this.node.getChildByName("BtUse").active=this.used!=1;
    }
    setCardName(cardName:string){
        this.cardName=cardName;
        this.node.getChildByName("LbName").getComponent(Label).string=cardName;
    }
    //事件
    onTouchEnd(e:EventTouch){
        console.log("onTouchEnd  card item");
        GameEvent.Instance.emit("cardEditItemSelect",{id:this.id});
    }
    onBtUse(){
        GameEvent.Instance.emit("cardEditItemUse",{id:this.id});
    }
}


