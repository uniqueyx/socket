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

    show(str:string,call:Function=null,cancel:Function=null) {
        this.confirmCall=call;
        this.cancelCall=cancel;
        // console.log("显示",str);
        this.node.getChildByName("LbInfo").getComponent(Label).string=str;

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


