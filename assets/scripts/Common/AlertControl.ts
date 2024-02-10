import { _decorator, Component, Node, Label } from 'cc';
import { AudioManager } from '../Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('AlertControl')
export class AlertControl extends Component {

    confirmCall:Function;
    cancelCall:Function;
    onLoad(){

    }

    start() {

    }

    update(deltaTime: number) {
        
    }

    show(str:string,showBtCancel:boolean=true,call:Function=null,cancel:Function=null) {
        this.confirmCall=call;
        this.cancelCall=cancel;
        // console.log("显示",str);
        this.node.getChildByName("LbInfo").getComponent(Label).string=str;
        
        this.node.getChildByName("BtConfirm").setPosition(showBtCancel?-100:0,this.node.getChildByName("BtConfirm").position.y);
        this.node.getChildByName("BtCancel").setPosition(100,this.node.getChildByName("BtCancel").position.y);
        this.node.getChildByName("BtCancel").active=showBtCancel;
    }
    //预制体绑定事件
    onBtConfirm(){
        AudioManager.inst.playOneShot("audio/bt_back");
        // console.log("alert确定",this.confirmCall);
        if(this.confirmCall){
            this.confirmCall();
            console.log("alert确定回调");
        }
        this.node.active=false;
    }
    onBtCancel(){
        AudioManager.inst.playOneShot("audio/bt_back");
        // console.log("alert取消",this.cancelCall);
        if(this.cancelCall){
            this.cancelCall();
            console.log("alert取消回调");
        }
        this.node.active=false;
    }
}


