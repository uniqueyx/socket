import { _decorator, Component, Label, Node } from 'cc';
import GameConfig from '../Base/GameConfig';
import GameEvent from '../Base/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('ForceItemControl')
export class ForceItemControl extends Component {

    force:number;
    start() {

    }

    update(deltaTime: number) {
        
    }
    init(force:number){
        this.force=force;
        this.node.getChildByName("LbName").getComponent(Label).string=GameConfig.FORCE_NAME[this.force];
    }
    onSelect(){
        GameEvent.Instance.emit("forceItemSelect",{force:this.force});
    }
}


