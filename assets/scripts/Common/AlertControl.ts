import { _decorator, Component, Node, Label } from 'cc';
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
        console.log("alert确定",this.confirmCall);
        if(this.confirmCall){
            this.confirmCall(5);
            console.log("确定回调")
        }
        this.node.active=false;
    }
    onBtCancel(){
        console.log("alert取消",this.cancelCall);
        this.node.active=false;
    }
}


