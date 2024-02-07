import { _decorator, Component, EventTouch, instantiate, Label, Node, NodeEventType, Prefab, ScrollView, tween, UITransform, Vec3, view } from 'cc';
import { SocketIO } from '../Base/SocketIO';
import { CardControl } from '../CardControl';
import GameEvent from '../Base/GameEvent';
import GameConfig from '../Base/GameConfig';
import { CardItemControl } from './CardItemControl';
import { AlertControl } from '../Common/AlertControl';
import { AudioManager } from '../Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('ArenaControl')
export class ArenaControl extends Component {
    @property(Prefab)
    Card:Prefab;

    @property(Prefab)
    CardItem:Prefab;

    @property(Prefab)
    Alert:Prefab;

    scrollList:Node;

    socketIO=null;
    isInit:boolean=false;
    canSelect:boolean=true;
    protected onLoad(): void {
        console.log("<<<<<<<<<<<<<<<onload arenaControl")
        // this.socketIO=SocketIO.Instance;
        // this.scrollList=this.node.getChildByName("ScrollView");
        // console.log("arenacontrol  onload",this.scrollList)
        // GameEvent.Instance.on("arena_info",this.reqAreanaInfo,this);
        // GameEvent.Instance.on("arena_selectInfo",this.reqAreanaSelect,this);
        // //游戏事件
        // GameEvent.Instance.on("cardItemTouch",this.cardItemTouch,this);

        // console.log("view",view.getVisibleSize())
        // let c=this.node.getParent().getComponent(UITransform).contentSize;
        // console.log("c>>",c)
    }
    onDestroy(){
        console.log("ArenaControl 竞技destroy");
        GameEvent.Instance.off("arena_info",this.reqAreanaInfo,this);
        GameEvent.Instance.off("arena_selectInfo",this.reqAreanaSelect,this);
        GameEvent.Instance.off("cardItemTouch",this.cardItemTouch,this);
    }    
    start() {
        console.log("Arena === start");
        
    }
    getInfo(){
        
        // this.scrollList.getChildByName("view").getChildByName("content").removeAllChildren();
        // console.log("scrollView",this.scrollList.getComponent(ScrollView))
        if(!this.socketIO){
            this.socketIO=SocketIO.Instance;
            this.scrollList=this.node.getChildByName("ScrollView");
            GameEvent.Instance.on("arena_info",this.reqAreanaInfo,this);
            GameEvent.Instance.on("arena_selectInfo",this.reqAreanaSelect,this);

            //游戏事件
            GameEvent.Instance.on("cardItemTouch",this.cardItemTouch,this);
        }
        // this.scrollList=this.node.getChildByName("ScrollView");
        console.log(this.node,"<<<<getInfo",this.scrollList)
        this.node.getChildByName("UISelect").active=false;   
        this.node.getChildByName("LbSelect").active=false;   
        this.scrollList.getComponent(ScrollView).content.removeAllChildren();
        let node=this.node.getChildByName("UIInfo").getChildByName("leftShowCard");
        if(node) node.active=false;
        this.canSelect=true;
        //发送准备开始消息
        this.socketIO.socket.emit("ARENA", {
            type: "arena_getInfo",
            user: this.socketIO.userID
        });
    }
    update(deltaTime: number) {
        
    }

    //方法
    showSelect(selectType:number,data:any){
            // let c= instantiate(this.Card);
            // let node=this.node.getChildByName("CardShow");
            // c.getComponent(CardControl).initData(0,id,0,0);
            // c.getComponent(CardControl).initParent();
        this.node.getChildByName("LbSelect").active=data.length;    
        this.node.getChildByName("UISelect").active=data.length;    
        this.node.getChildByName("BtRestart").active=!data.length;    
        this.node.getChildByName("BtStartGame").active=!data.length;
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        let num=0;
        for(const cardItem of parentNode.children){
            let cardControl=cardItem.getComponent(CardItemControl);
            num+=cardControl.count;
        }    
        this.node.getChildByName("LbRightListCount").getComponent(Label).string=num+"/"+GameConfig.CARD_COUNT_LIMIT;
        this.node.getChildByName("LbRightList").getComponent(Label).string=(selectType?GameConfig.FORCE_NAME[selectType]:"竞技")+"势力";
        if(data.length==0){
            console.log("卡组完成了");

            return;
        }

        this.node.getChildByName("LbSelect").getComponent(Label).string=selectType?"请选择一张卡牌":"请选择一个势力";    
        for(let i=0;i<3;i++){
            let selectItem=this.node.getChildByName("UISelect").getChildByName("SelectItem"+i);
            selectItem.getChildByName("Label").active=!selectType;
            if(selectItem.getChildByName("card"))   selectItem.getChildByName("card").active=selectType>0;
            if(selectType){
                // selectItem.removeAllChildren();
                if(selectItem.getChildByName("card")){
                    selectItem.getChildByName("card").active=true;
                    selectItem.getChildByName("card").getComponent(CardControl).changeData(data[i]);
                }else{
                    let c= instantiate(this.Card);
                    c.name="card";
                    c.getComponent(CardControl).initData(0,data[i],0,i);
                    c.getComponent(CardControl).initParent(selectItem);
                }
                
            }else{
                selectItem.getChildByName("Label").getComponent(Label).string=GameConfig.FORCE_NAME[data[i]];
            }
        }    

    }
    addToList(id:number){
        
        // let parentNode=this.scrollList.getChildByName("view").getChildByName("content");
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        let card=this.getCardItem(id);
        if(card) card.getComponent(CardItemControl).changeCount(1);
        else{
            let c= instantiate(this.CardItem);
            c.getComponent(CardItemControl).initData(id,1);
            c.setParent(parentNode);
        }
    }
    showList(data:any){
        // let parentNode=this.scrollList.getChildByName("view").getChildByName("content");
        // console.log("this.scrollList>>",this.scrollList)
        // console.log("node scrollview",this.node.children.length);
        // if(!this.scrollList){
        //     this.scheduleOnce(()=>{ console.log("this.scrollList>>",this.scrollList)},2)
        //     return;
        // }
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        parentNode.removeAllChildren();
        for(let i=0;i<data.length;i++){
            this.addToList(data[i]);
            // let card=this.getCardItem(data[i]);
            // if(card) card.getComponent(CardItemControl).changeCount(1);
            // else{
            //     let c= instantiate(this.CardItem);
            //     c.getComponent(CardItemControl).initData(data[i],1);
            //     c.setParent(parentNode);
            // }
        }
    }
    getCardItem(id:number):Node{
        // let parentNode=this.scrollList.getChildByName("view").getChildByName("content");
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        for(const card of parentNode.children){
            let cardControl=card.getComponent(CardItemControl);
            if(cardControl.baseData.id==id){
                return card;
            }
        }    
        return null;
    }
    //点击选择卡牌
    onBtSelect(e:Event,data:string){
        if(!this.canSelect) {
            console.log("未处理完 不能点")
            return;
        }    
        AudioManager.inst.playOneShot("audio/select_card");
        console.log("onBtSelect>>",data);
        let selectItem=this.node.getChildByName("UISelect").getChildByName("SelectItem"+data);
        let selectType=selectItem.getChildByName("Label").active?0:1;
        // return;
        this.socketIO.socket.emit("ARENA", {
            type: "arena_select",
            selectType:selectType,
            index:parseInt(data),
            user: this.socketIO.userID
        });
        this.canSelect=false;
        // this.scheduleOnce(()=>{
        //     this.canSelect=true;
        // },0.5);
    }
    //开始组卡
    onStartCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        console.log("开始组卡");
        this.socketIO.socket.emit("ARENA", {
            type: "arena_restart",
            user: this.socketIO.userID
        });
        // let al= instantiate(this.Alert);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show("重新组卡会清除当前组好的卡组，确定要重新组卡吗？",true,()=>{
            
        // });
        // al.setParent(this.node);
    }
    //重新组卡
    onBtRestart(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        console.log("重新组卡");
        let al= instantiate(this.Alert);
        let aControl=al.getComponent(AlertControl);
        aControl.show("重新组卡会清除当前组好的卡组，确定要重新组卡吗？",true,()=>{
            this.socketIO.socket.emit("ARENA", {
                type: "arena_restart",
                user: this.socketIO.userID
            });
        });
        al.setParent(this.node);
    }
    //开始游戏
    onBtStartGame(){
        AudioManager.inst.playOneShot("audio/bt_big");
        console.log("开始竞技");
        this.socketIO.socket.emit("ROOM", {
            type: "match_room",
            gameType:1,
            user: this.socketIO.userID
        });
    }
    onBtReturnHall(){
        AudioManager.inst.playOneShot("audio/bt_back");
        console.log("返回大厅");
        this.node.active=false;
    }
    //游戏事件
    cardItemTouch(data:any){
        console.log("点击carditem",data);
        let id=parseInt(data.id);

        let node=this.node.getChildByName("UIInfo");
        let leftNode=node.getChildByName("leftShowCard");
        if(leftNode){
            leftNode.getComponent(CardControl).changeData(id,0);
            leftNode.active=true;
        }else{
            let c= instantiate(this.Card);
            c.name="leftShowCard";
            c.setPosition(100,300);
            // c.setParent(this.node.getChildByName("CardShow"));
            c.getComponent(CardControl).initData(0,id,0,node.children.length);
            c.getComponent(CardControl).initParent(node);
        }
    }
    // onTouchStart(e:EventTouch){
    //     console.log("hide TIP onTouchEnd《《《《《《《《《《《《《《《《测试触摸事件 ");
    //     // Toast.hideTip();
    //     let node=this.node.getChildByName("UIInfo").getChildByName("leftShowCard");
    //     if(node) node.active=false;
    // } 
    //服务器消息
    reqAreanaInfo(data:any){
        //force selectedCards currentCards
        console.log("服务器消息 竞技场信息",data);
        this.showList(data.selectedCards);
        this.showSelect(data.force?data.force:0,data.currentCards);
        if(data.new){
            this.node.getChildByName("BtSartCard").active=true;
            this.node.getChildByName("BtRestart").active=false;    
            this.node.getChildByName("BtStartGame").active=false;
        }else this.node.getChildByName("BtSartCard").active=false;
    }
    reqAreanaSelect(data:any){
        console.log("服务器消息 竞技场选牌",data);
        if(data.selectType) {
            //飞入效果
            for(let i=0;i<3;i++){
                let selectItem=this.node.getChildByName("UISelect").getChildByName("SelectItem"+i);
                // selectItem.getChildByName("Label").active=!selectType;
                let card=selectItem.getChildByName("card");
                if(card){
                    let cardControl=card.getComponent(CardControl);
                    if(cardControl.baseData.id==data.selectCard){
                        // this.canSelect=false;
                        let c= instantiate(this.Card);
                        // c.name="leftShowCard";
                        c.setPosition(selectItem.position.x-50,selectItem.position.y);
                        c.getComponent(CardControl).initData(0,data.selectCard,0,1);
                        c.getComponent(CardControl).initParent(this.node.getChildByName("UIInfo"));
                        tween(c).to(0.3,{position:new Vec3(270,0),scale:new Vec3(0.2,0.2,1)}).
                        call(() => { 
                            c.removeFromParent();
                            this.addToList(data.selectCard);
                            this.showSelect(data.force,data.currentCards);
                            this.canSelect=true;
                        }).
                        start();
                        break;
                    }
                } 
            }    
            
        }else{
            this.showSelect(data.force,data.currentCards);
            this.canSelect=true;
        }    
        
    }
}


