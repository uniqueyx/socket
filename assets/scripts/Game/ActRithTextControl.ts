import { _decorator, Component, Node, EventTouch, Button, Label } from 'cc';
import { GameControl } from '../../GameControl';
const { ccclass, property } = _decorator;

@ccclass('ActRithTextControl')
export class ActRithTextControl extends Component {
    onLoad(){

    }
    start() {

    }

    update(deltaTime: number) {
        
    }
    //<size=10 click="handler2">click me</size>
    cardClick(e:EventTouch, param:string){
        console.log("cardClick", param);
        // this.node.getComponent()
        this.node.getParent().getParent().getComponent(GameControl).showRichTextCard(param);
    }

    
}


