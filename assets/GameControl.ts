import { _decorator, Component, Node, Prefab, instantiate, Vec3, Label, director, tween, view, Vec2, UITransform, Size, Rect, Color, NodeEventType, EventTouch, UIOpacity, RichText, Button, Sprite, Tween } from 'cc';
import GameConfig from './scripts/Base/GameConfig';
import GameEvent from './scripts/Base/GameEvent';
import { SocketIO } from './scripts/Base/SocketIO';
import Toast from './scripts/Base/Toast';
import { CardControl } from './scripts/CardControl';
import { AlertControl } from './scripts/Common/AlertControl';
import { AudioManager } from './scripts/Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('GameControl')
export class GameControl extends Component {
    @property(Prefab)
    Card:Prefab;
    // @property(Prefab)
    // Alert:Prefab;
    @property(Prefab)
    RedCross:Prefab;

    socketIO=null;

    cardTable:Node;
    // actShow:Node;
    actString="";

    countDownTime:number;
    myTurn:boolean;
    hp:number;
    hpOther:number;

    first:boolean;//是否先攻
    gameState:number;//游戏状态阶段 1准备 2换牌 3回合开始
    turnCount:number;//回合数
    useGeneralTimes:number;//武将通常召唤次数
    changeHand:boolean;//是否更换完手牌
    onLoad(){
        // GameEvent.Instance.on("match_success")
        this.socketIO=SocketIO.Instance;
        this.cardTable=this.node.getChildByName("CardTable");
        GameEvent.Instance.on("connected",this.reqConnected,this);
        GameEvent.Instance.on("disconnect",this.reqDisconnect,this);
        GameEvent.Instance.on("game_start",this.reqGameStart,this);
        GameEvent.Instance.on("game_data",this.reqGameData,this);
        GameEvent.Instance.on("card_info",this.reqCardInfo,this);
        GameEvent.Instance.on("game_over",this.reqGameOver,this);
        GameEvent.Instance.on("game_error",this.reqError,this);
        GameEvent.Instance.on("game_dissolve",this.reqGameDissolve,this);
        GameEvent.Instance.on("draw",this.reqDraw,this);
        GameEvent.Instance.on("draw_other",this.reqDrawOther,this);
        GameEvent.Instance.on("turn_start",this.reqTurnStart,this);
        GameEvent.Instance.on("card_used",this.reqCardUsed,this);
        GameEvent.Instance.on("card_attack",this.reqCardAttack,this);
        GameEvent.Instance.on("card_update",this.reqCardUpdate,this);
        GameEvent.Instance.on("buff_update",this.reqBuffUpdate,this);
        GameEvent.Instance.on("hp_update",this.reqHPUpdate,this);
        GameEvent.Instance.on("card_changeHand",this.reqCardChangeHand,this);
        //游戏事件
        GameEvent.Instance.on("updateCardIndex",this.updateCardIndex,this);
        //触摸事件
        this.node.on(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
        
        
        // if(this.Card)   {
        //     let ca= instantiate(this.Card);
        // }    
        
        this.initUI();
        //发送准备开始消息
        this.sendGameReady();
        
        console.log( '<<onload     socket  userid',this.socketIO.userID );
        return;
        if(this.Card){
            for (let i=0;i<7 ;i++) {
                let c= instantiate(this.Card);
                // c.setPosition(new Vec3(20+i*140-360+60,-60));
                // this.cardTable.addChild(c);
                c.setParent(this.node.getChildByName("Bottom").getChildByName("Layout"))
                // i>4&&console.log("测试i",i);
            }
        }
    }
    onDestroy(){
        console.log("gamecontrol 游戏场景destroy");
        GameEvent.Instance.off("disconnect",this.reqDisconnect,this);
        GameEvent.Instance.off("game_start",this.reqGameStart,this);
        GameEvent.Instance.off("game_data",this.reqGameData,this);
        GameEvent.Instance.off("card_info",this.reqCardInfo,this);
        GameEvent.Instance.off("game_over",this.reqGameOver,this);
        GameEvent.Instance.on("game_error",this.reqError,this);
        GameEvent.Instance.off("game_dissolve",this.reqGameDissolve,this);
        GameEvent.Instance.off("draw",this.reqDraw,this);
        GameEvent.Instance.off("draw_other",this.reqDrawOther,this);
        GameEvent.Instance.off("turn_start",this.reqTurnStart,this);
        GameEvent.Instance.off("card_used",this.reqCardUsed,this);
        GameEvent.Instance.off("card_attack",this.reqCardAttack,this);
        GameEvent.Instance.off("card_update",this.reqCardUpdate,this);
        GameEvent.Instance.off("buff_update",this.reqBuffUpdate,this);
        GameEvent.Instance.off("hp_update",this.reqHPUpdate,this);
        GameEvent.Instance.off("card_changeHand",this.reqCardChangeHand,this);
        //游戏事件
        GameEvent.Instance.off("updateCardIndex",this.updateCardIndex,this);

        this.node.off(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.off(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.off(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
    }
    start() {
        console.log("gamecontrol  start触发");
        // let scene=director.getScene();
        console.log("init gamecontrol  start",this.Card);
        
    }

    test(){
        console.log('test>>',this.Card);
        director.loadScene("hall");
    }
    judgeTest(){
        console.log("judgeTest")
    }


    update(deltaTime: number) {                                                                                                                                                         
        
    }

    //==================方法
    sendGameReady(){
        if(this.socketIO.socket){
            this.socketIO.socket.emit("GAME", {
                type: "game_ready",
                user: this.socketIO.userID
            });
        }
    }
    initUI(){
        this.useGeneralTimes=1;
        this.actString="";
        this.turnCount=0;
        this.hp=GameConfig.INIT_HP;
        this.hpOther=GameConfig.INIT_HP;

        // this.node.getChildByName("Bg").getComponent(Sprite).changeSpriteFrameFromAtlas

        this.node.getChildByName("UICenter").getChildByName("BtTurnEnd").active=false;
        this.node.getChildByName("UICenter").getChildByName("LbOtherTurn").active=false;

        this.node.getChildByName("ActShow").getChildByName("RichText").getComponent(RichText).string="";
        this.node.getChildByName("ActShow").getChildByName("RichTextBg").getComponent(UITransform).height=0;
        this.node.getChildByName("LeftBottom").getChildByName("LbName").getComponent(Label).string=GameConfig.USER_DATA.nick;//this.socketIO.userID;
        this.node.getChildByName("LeftBottom").getChildByName("LbHP").getComponent(Label).string=String(GameConfig.INIT_HP);
        this.node.getChildByName("RightTop").getChildByName("LbHP").getComponent(Label).string=String(GameConfig.INIT_HP);
        
        this.node.getChildByName("WaitUI").active=true;
        // this.node.getChildByName("ActShow").getComponent(UIOpacity).opacity=150;
    }
    countDown(){
        console.log("倒计时方法参数");
        this.countDownTime--;
        let lb=this.node.getChildByName("UICenter").getChildByName("LbCountdown").getComponent(Label);
        lb.string=String(this.countDownTime);
        
    }
    //回合结束
    onBtTurnEnd(){
        // let ran=Math.random();
        // this.updateHP(ran<0.5?-10:10);
        // return;
        AudioManager.inst.playOneShot("audio/bt_back");
        this.socketIO.socket.emit("GAME", {
            type: "turn_end",
            user: this.socketIO.userID
        });
    }
    //投降
    onBtSurrender(){
        //测试代码

        AudioManager.inst.playOneShot("audio/bt_back");
        console.log("发送 投降");
        Toast.alert("确定投降结束本局对战吗？",true,()=>{
            this.sendSurrender();
        });
        // let al= instantiate(this.Alert);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show("确定投降结束本局对战吗？",true,()=>{
        //     this.sendSurrender();
        // });
        // al.setParent(this.node);
    }
    //发送投降消息
    sendSurrender(){
        // console.log("参数value");
        this.socketIO.socket.emit("GAME", {
            type: "game_surrender",
            user: this.socketIO.userID
        });
    }
    //发送更换手牌消息
    onBtChangeHand(){
        AudioManager.inst.playOneShot("audio/bt_back");
        let cardNode=this.node.getChildByName("ChangeCardShow").getChildByName("NodeCard");
        // let changeNode=this.node.getChildByName("ChangeCardShow");
        let arr=[];
        for(const card of cardNode.children){
            let uid=card.getComponent(CardControl).uid;
            //changeNode.getChildByName()
            let uidChange=this.node.getChildByName("ChangeCardShow").getChildByName(String(uid)).active?uid:0;
            arr.push(uidChange);
        }
        console.log("发送 切换手牌",arr);
        this.socketIO.socket.emit("GAME", {
            type: "game_changeHand",
            cardList:arr,
            user: this.socketIO.userID
        });
    }
    testFun(){
        console.log("测试 调用了 testFun")
    }
    //====特招相关方法
    //判断能否特招  need
    judgeCardNeed(card:CardControl){
        if(card.baseData.need==0) return 0;
        let bool=0;
        let need=JSON.parse(card.baseData.need);//解析
        for(let i=0;i<need.length;i++){
            // console.log(useCard.appear[i].id,useCard.appear[i].obj,"战吼效果",useCard.appear[i].value,"玩家",useCard.owner)
            if(this.judgeCardNeedOne(need[i],card)) bool++;
        }
        console.log(bool,"特招条件判断",need.length)
        if(bool==need.length) return 1;
        else return -1;
    }
    judgeCardNeedOne(effect:any,card:CardControl){
        // let player=card.owner;
        // let other=player=="one"?"two":"one";
        switch (effect.id){
            case 901://存在卡数量
                // let cardPool=this.getCardPool(effect,player);//获取卡牌的位置数组
                let cardPool=this.getCardPool(effect)//获取卡牌的位置数组
                console.log(cardPool.length,"<<<cardpool");
                //条件过滤处理
                let cardPoolNew=this.getConditionCardPool(cardPool,effect,card);
                console.log(cardPoolNew.length,"effect.num>",effect.num,"<<<cardPoolNew 条件过滤处理");
                return this.judgeCondition("num",effect.num,cardPoolNew.length);
                break;
            case 902://士气
                // effect.obj==1
                let hp1=true;
                let hp2=true;
                if(effect.obj==1||effect.obj==3){
                    hp1=this.judgeCondition("hp",effect.hp,this.hp)
                }
                if(effect.obj==2||effect.obj==3){
                    hp2=this.judgeCondition("hp",effect.hp,this.hpOther)
                }
                console.log(hp1,"hp条件判断",hp2)
                return hp1&&hp2;
                break;    
        }    
    }
    getConditionCardPool(cardPool:any[],effect:any,useCard:CardControl){
        let cardPoolNew=[];
        for(let i=0;i<cardPool.length;i++){
            let cardPoolOne:CardControl=cardPool[i].getComponent("CardControl");
            if(cardPoolOne.uid==useCard.uid) {
                if(effect.noself==1){
                    continue;//破坏卡默认排除自身 判断301破坏 401添加buff 501
                }
            }    
            if(effect.hasBuff){
                console.log(effect.hasBuff,"判断hasbuff",cardPoolOne.getBuff(effect.hasBuff).length,cardPoolOne.buffList);
            }
            if(!cardPoolOne.baseData) {//陷阱卡特殊判断
                if(this.judgeCondition("cardType",effect.cardType,3)){
                    cardPoolNew.push(cardPoolOne);
                }
                continue;
            }    
            if(this.judgeCondition("cardType",effect.cardType,cardPoolOne.baseData.cardType)&&this.judgeCondition("force",effect.force,cardPoolOne.baseData.force)&&
            this.judgeCondition("rare",effect.rare,cardPoolOne.baseData.rare)&&this.judgeCondition("name",effect.name,cardPoolOne.baseData.name)&&
            this.judgeCondition("hasBuff",effect.hasBuff,effect.pos==4?1:cardPoolOne.getBuff(effect.hasBuff).length)&&this.judgeCondition("atk",effect.atk,effect.pos==4?cardPoolOne.baseData.attack:cardPoolOne.getAttack()) ){
                cardPoolNew.push(cardPoolOne);
            }
        }
        return cardPoolNew;
    }
    //条件判断
    judgeCondition(key:string,condition:any,value:any){
        if(condition==undefined) return true;//属性不存在跳过判断直接返回true
        switch(key){
            case "name":
            case "rare":
            case "cardType":
                if(String(condition).indexOf(String(value))!=-1) return true;
                break;
            case "hasBuff":
                if(value>=1) return true;
                break;      
            case "force": 
            // case "rare":
            
                if(condition==value) return true;
                break;
            case "atk":
            case "num":    
            case "hp":
                // console.log(Number(condition.substring(1)),"<条件",key,"条件检查>>卡的值",value)
                if(condition.charAt(0)=="="){
                    if(Number(condition.substring(1))==value) return true;
                }else if(condition.charAt(0)==">"){
                    if(Number(condition.substring(1))<=value) return true;
                }else if(condition.charAt(0)=="<"){
                    if(Number(condition.substring(1))>=value) return true;
                }
                break;
            
        }
        return false;
    }
    //==============card触发的方法
    //判断能否使用卡牌
    judgeCardUse(cardControl:CardControl):boolean{
        if(!this.myTurn) {
            return false;
        }    
        if(cardControl.baseData.cardType==1&&this.getTableCardList(1).length==GameConfig.TABLEGENERAL_LIMIT){
            console.log("场上武将卡已经满了");
            Toast.toast("场上武将数量达到上限！");
            return false;
        }
        if(cardControl.baseData.cardType>1&&this.getTableCardList(2).length==GameConfig.TABLEMAGIC_LIMIT){
            console.log("场上计策陷阱卡区域已经满了");
            Toast.toast("场上计策陷阱区域达到上限！");
            return false;
        }
        //判断特招条件
        // let need=JSON.parse(cardControl.baseData.need);
        // console.log(typeof need,"<<<<<need",need);
        if(cardControl.baseData.cardType==1){
            let judgeNeedResult=this.judgeCardNeed(cardControl);
            if(judgeNeedResult==-1){
                Toast.toast("特殊召唤条件不满足 无法召唤");
                return;
            }
            else if(judgeNeedResult==0)  {
                if(this.useGeneralTimes==0){
                    Toast.toast("一回合只能进行一次通常召唤！");
                    // console.log(card.cardType,"通常召唤次数不足 是否有BUG》》》》》》》》》》》》》》》》》》》》",card);
                    return;
                }
                // this.useGeneralTimes--;
            }  
            console.log(cardControl.index,"特招判断>",judgeNeedResult,this.useGeneralTimes,"<<<cardControl  发送卡牌消息");
        }
        //判断同名陷阱卡
        if(cardControl.baseData.cardType==3){
            if(this.getTableCardByID(cardControl.baseData.id).length>0){
                Toast.toast("场上已存在相同陷阱卡!");
                return;
            }
        }

        //发送使用卡牌消息
        SocketIO.Instance.socket.emit("GAME", {
            type: "card_use",
            user: SocketIO.Instance.userID,
            index:cardControl.index,
            uid:cardControl.uid
        });
        return true;
    }
    //显示攻击箭头
    showAttackArrow(startPos:Vec3,endPos:Vec3){
        let distance=Vec3.distance(startPos,endPos);
        let min=50;
        let nodeArrow=this.node.getChildByName("attackArrow");
        if(distance<min) {
            if(nodeArrow.active)   nodeArrow.active=false;
            return;
        }    
        if(!nodeArrow.active)   nodeArrow.active=true;
        let arrowSize=nodeArrow.getComponent(UITransform).contentSize;
        // console.log(distance,"<<攻击长度");
        this.node.getChildByName("attackArrow").setPosition(startPos);
        this.node.getChildByName("attackArrow").getComponent(UITransform).setContentSize(new Size(distance<min?min:distance,arrowSize.height));
        let rotation = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        let angle=rotation/(Math.PI/180);  
        // console.log(rotation,"<<<弧度箭头角度",angle);
        this.node.getChildByName("attackArrow").setRotationFromEuler(new Vec3(0, 0, angle));//-90
    }
    hideArrow(){
        this.node.getChildByName("attackArrow").active=false;
    }
    //攻击
    judgeAttack(attackC:CardControl,endPos:Vec3){
        console.log("判断攻击>>",endPos);
        let w=60;
        let h=90;
        //嘲讽判断
        // let targetC:CardControl;
        let targetUid=-1;
        let targetTaunt=false;//目标武将是否有嘲讽
        for(const card of this.cardTable.children){
            let cardControl=card.getComponent(CardControl);
            if(cardControl.baseData&&cardControl.baseData.cardType==1&&cardControl.posType==12){
                if((endPos.x>card.position.x-w)&&(endPos.x<card.position.x+w)&&(endPos.y>card.position.y-h)&&(endPos.y<card.position.y+h)){
                    // targetC=cardControl;
                    targetUid=cardControl.uid;
                    if(cardControl.getBuff(GameConfig.BUFF_TAUNT).length>0) targetTaunt=true;
                    // console.log("找到攻击目标uid",targetUid);
                    break;
                }
            }
        }
        if(this.turnCount==1){
            Toast.toast("先攻第一回合无法直接攻击！");
            return;
        }
        //判断对面无怪直接攻击
        if(targetUid>0||(this.getTableCardList(1,false).length==0&&endPos.y>60)){
            if(attackC.attackCount<=attackC.attackedCount){
                Toast.toast("该武将已经攻击过了");
                return;
            }
            let arrTarget=this.getTableCardList(1,false);
            if(arrTarget.length>0&&!targetTaunt){
                for(const card of arrTarget){
                    let cControl=card.getComponent(CardControl);
                    if(cControl.getBuff(GameConfig.BUFF_TAUNT).length>0){
                        Toast.toast("必须先攻击嘲讽武将");
                        return;
                    }
                }
            }

            //发送使用卡牌消息
            SocketIO.Instance.socket.emit("GAME", {
                type: "card_attack",
                user: SocketIO.Instance.userID,
                uid:attackC.uid,
                target:targetUid
            });
        }   
        
        // new Rect().contains() 
    }
    //消息方法
    initCard(data:any){
        this.cardTable.removeAllChildren();
        this.node.getChildByName("Bottom").removeAllChildren();
        this.node.getChildByName("Top").removeAllChildren();
        this.node.getChildByName("RightBottom").removeAllChildren();
        this.node.getChildByName("LeftTop").removeAllChildren();
        this.initHandCard(data.handCards);
        this.initRemainCard(data.remainCards);
        this.initHandCard(data.otherHandCards,false);
        this.initRemainCard(data.otherRemainCards,false);
        this.initTableCard(data.tableCards,1);
        this.initTableCard(data.otherTableCards,1,false);
        this.initTableCard(data.magicCards,3);
        this.initTableCard(data.otherMagicCards,3,false);
        if(this.gameState==2){
            this.updateChangeCardPos();
        }
    }
    updateChangeCardPos(){
        let changeNode=this.node.getChildByName("ChangeCardShow").getChildByName("NodeCard");
        let node=this.node.getChildByName("Bottom");
        // for(const cardHand of node.children){
        for(let i=0;i<GameConfig.HANDCARD_COUNT;i++){   
            // console.log(node.children.length,i,"测试1");//,node.children[0].getComponent(CardControl).index
            node.children[0].setParent(changeNode)//设置parent为ChangeCardShow
            // cardHand.setParent(changeNode);
            // changeNode.addChild(card);
            // console.log("测试2",node.children[0].getComponent(CardControl).index);
        }    
        let width=720;
        let cardHalf=80;
        let cardNum=node.children.length;
        if(cardNum>GameConfig.HANDCARD_LIMIT) cardNum=GameConfig.HANDCARD_LIMIT;
        cardNum=GameConfig.HANDCARD_COUNT;
        
        let apart=cardHalf*2;//-cardHalf*2
        if(cardNum>4) apart=(width-cardHalf*2)/(cardNum-1);
        for(const card of changeNode.children){
            // console.log(changeNode.children.length,card,"<<<<<changeNode",card.getComponent(CardControl))
            let index:number=card.getComponent(CardControl).index;
            let posX:number;
            if(cardNum<=4){
                posX=( index* cardHalf*2) - (cardNum-1)*cardHalf;
            }
            else {
                if(index==cardNum-1) posX=width/2-cardHalf;
                else posX=-width/2+cardHalf+index*apart;
            }    
            // posX=-width/2+cardHalf+index*apart;
            // console.log("间隔坐标x",posX);
            card.setPosition(posX,0);//card.position.y
            //初始化红叉
            let redCross=instantiate(this.RedCross);
            redCross.name=String(card.getComponent(CardControl).uid);
            redCross.active=false;
            redCross.setPosition(card.position);
            redCross.setParent(this.node.getChildByName("ChangeCardShow"));
            console.log(cardNum,"调整更换手牌坐标>>",index,posX);
        }
    }
    selectChangeCard(uid:number){
        if(this.changeHand) return;
        AudioManager.inst.playOneShot("audio/bt_small");
        let redCross=this.node.getChildByName("ChangeCardShow").getChildByName(String(uid));
        // console.log(redCross.active,"选中卡",uid);
        if(redCross)    redCross.active=!redCross.active;
    }
    
    initHandCard(data:any,myself:boolean=true){
        console.log("初始化手牌",data.length);
        let parent=this.node.getChildByName(myself?"Bottom":"Top");
        for(let i=0;i<data.length;i++){
            let c= instantiate(this.Card);
            // c.setParent(parent);
            c.getComponent(CardControl).initData(myself?1:11,data[i].id,data[i].uid,i);
            c.getComponent(CardControl).initParent(parent);
        }
        this.updateHandCardPos(myself);
    }
    initTableCard(data:any,updateType:number,myself:boolean=true){
        console.log("初始化场上的牌",data.length);
        let parent=this.cardTable;//this.node.getChildByName(myself?"Bottom":"Top");
        for(let i=0;i<data.length;i++){
            let c= instantiate(this.Card);
            // c.setParent(parent);
            let cardControl=c.getComponent(CardControl);
            cardControl.initData(myself?2:12,data[i].id,data[i].uid,i);//this.getTableCardList(updateType,myself).length
            cardControl.initParent(parent);
            if(data[i])    cardControl.updateData(data[i]);

        }
        // this.updateHandCardPos(myself);
        this.updateTableCardPos(updateType,myself);
    }
    initRemainCard(data:any,myself:boolean=true){
        console.log("初始化牌堆",data);
        let value=myself?1:-1;
        for(let i=0;i<data;i++){
            let c= instantiate(this.Card);
            c.setPosition((5+i*0.4)*value,i*0.4);
            // c.setParent(this.node.getChildByName(myself?"RightBottom":"LeftTop"));
            c.getComponent(CardControl).initData(myself?3:13,0,i);
            c.getComponent(CardControl).initParent(this.node.getChildByName(myself?"RightBottom":"LeftTop"));
        }
        this.updateRemainCardNum(myself);
    }
    addRemainCard(myself:boolean=true){
        let parent=this.node.getChildByName(myself?"RightBottom":"LeftTop");
        let value=myself?1:-1;
        let c= instantiate(this.Card);
        c.setPosition((5+(parent.children.length-1)*0.4)*value,(parent.children.length-1)*0.4);
        // c.setParent(this.node.getChildByName(myself?"RightBottom":"LeftTop"));
        c.getComponent(CardControl).initData(myself?3:13,0,(parent.children.length-1));
        c.getComponent(CardControl).initParent(parent);
        this.updateRemainCardNum(myself);
    }
    removeRemainCard(myself:boolean=true){
        let parent=this.node.getChildByName(myself?"RightBottom":"LeftTop");
        // let value=myself?1:-1;
        if(parent.children.length>0)parent.children[0].removeFromParent();
        this.updateRemainCardNum(myself);
    }
    //调整卡牌间隔坐标
    updateHandCardPos(myself:boolean=true){
        let node=this.node.getChildByName(myself?"Bottom":"Top");
        let width=480;
        let cardHalf=60;
        let cardNum=node.children.length;
        if(cardNum>GameConfig.HANDCARD_LIMIT) cardNum=GameConfig.HANDCARD_LIMIT;
        
        let apart=cardHalf*2;//-cardHalf*2
        if(cardNum>4) apart=(width-cardHalf*2)/(cardNum-1);
        for(const card of node.children){
            let index:number=card.getComponent(CardControl).index;
            let posX:number;
            if(cardNum<=4){
                posX=( index* cardHalf*2) - (cardNum-1)*cardHalf;
            }
            else {
                if(index==cardNum-1) posX=width/2-cardHalf;
                else posX=-width/2+cardHalf+index*apart;
            }    
            if(!myself) posX=-posX;//对手手牌坐标对称
            // posX=-width/2+cardHalf+index*apart;
            // console.log("间隔坐标x",posX);
            card.setPosition(posX,0);//card.position.y
            console.log(cardNum,"调整手牌坐标>>",index,posX)
        }
        
    }
    //调整桌面召唤的卡牌间隔坐标
    updateTableCardPos(cardType:number,myself:boolean=true){
        // let node=this.node.getChildByName(myself?"Bottom":"Top");
        let arrNode=this.getTableCardList(cardType,myself);//1
        console.log(cardType,"updateTableCardPos   getTableCardList 数组长度",arrNode.length);
        let width=720;
        let cardHalf=60;
        let cardNum=arrNode.length;
        
        let apart=10;//-cardHalf*2
        // if(cardNum>4) apart=(width-cardHalf*2)/(cardNum-1);
        let posY=cardType==1?-120:(-120-180-30-5);
        if(!myself) posY=-posY;
        for(let i=0;i< arrNode.length;i++){
            let card=arrNode[i];
            let index:number=card.getComponent(CardControl).index;
            let posX:number;
            posX=( index* (cardHalf+apart)*2) - (cardNum-1)*(cardHalf+apart);
            if(!myself) {//对手手牌坐标对称
                posX=-posX;
            }    
            card.setPosition(posX,posY);
            console.log(cardNum,card.getComponent(CardControl).uid,"数量",myself,index,"场上坐标>>",posX,posY);
        }
    }
    //移除场上牌
    removeTableCard(uid:number,myself:boolean=true){
        let node=this.cardTable;
        let index=0;
        let cardType=1;
        //cardType undefined 经常有BUG
        for(const card of node.children){
            if(card.getComponent(CardControl).uid==uid){
                index=card.getComponent(CardControl).index;
                cardType=card.getComponent(CardControl).baseData?card.getComponent(CardControl).baseData.cardType:2;
                // if(card.getComponent(CardControl).state==1){//攻击动效中 延迟移除
                //     console.log(uid,"=======state设置成2",myself);
                //     card.getComponent(CardControl).state=2;
                //     return;
                // }
                // else card.removeFromParent();
                card.removeFromParent();
            }
        }
        for(const card of node.children){
            let cardC=card.getComponent(CardControl);
            if(cardC&&cardC.posType==(myself?2:12)&&cardC.index>index){
                if( (cardType==1&&cardC.baseData&&cardC.baseData.cardType==cardType) || (cardType>1&&(!cardC.baseData|| (cardC.baseData&&cardC.baseData.cardType>1) ) ) ){
                    cardC.index--;
                }
            }
            // if(cardC.baseData&&(cardC.baseData.cardType==cardType||(cardC.baseData.cardType>1&&cardType>1))&&cardC.posType==(myself?2:12)&&cardC.index>index){
            //     cardC.index--;
            // }
        }
        this.updateTableCardPos(cardType,myself);
        console.log("==removeTableCard 移除牌后数量",node.children);
    }
    //更新显示深度索引 用于手牌   暂时弃用
    updateCardIndex(data:any){//index:number,sIndex:number
        console.log("updateCardIndex>>>>>>>",data);
        let arr=[];//按index排序的卡牌数组
        // this.node.getChildByName("Bottom").children.sort((a, b) => a.index - b)
        for(const card of this.node.getChildByName("Bottom").children){
            let cindex:number=card.getComponent(CardControl).index;
            arr[cindex]=card;
            // console.log("设置索引 深度",cindex,card.getSiblingIndex());
        }    
        for(let i=0;i<arr.length;i++){
            if(i>data.index){
                arr[i].setSiblingIndex(data.sIndex-(i-data.index));
            }else if(i<data.index){
                arr[i].setSiblingIndex(i);
            }
        }
    }
    //返回卡组
    tableToRemain(uid:number,myself:boolean){
        let node=this.cardTable;
        for(const card of node.children){
            if(card.getComponent(CardControl).uid==uid){
                let value=myself?1:-1;
                let hNode=this.node.getChildByName(myself?"RightBottom":"LeftTop");
                let hposX=0;//180*value;//手牌最后一张的坐标
                let handPosition=new Vec3(hNode.position.x+hposX,hNode.position.y);
                tween(card).to(0.3,{position:handPosition}).
                call(() => { 
                    //更新卡组数量
                    this.addRemainCard(myself);
                    this.updateRemainCardNum(myself);
                    // c.setPosition(hposX,0);
                    this.removeTableCard(uid,myself);
                }).
                start();
                break;
            }
        }
    }
    //返回手牌
    tableToHand(uid:number,myself:boolean){
        let node=this.cardTable;
        for(const card of node.children){
            if(card.getComponent(CardControl).uid==uid){
                let value=myself?1:-1;
                let posX=-120*value;//-120
                let posY=-40*value;//-40
                let hNode=this.node.getChildByName(myself?"Bottom":"Top");
                let hposX=180*value;//手牌最后一张的坐标
                // let handPosition=new Vec3(hposX,0);
                let handPosition=new Vec3(hNode.position.x+hposX,hNode.position.y);
                tween(card).to(0.3,{position:handPosition}).
                call(() => { 

                    //生成获得卡牌数据
                    let overflow=0;//满出的手牌id
                    let cardNum=hNode.children.length;
                    if(cardNum>=GameConfig.HANDCARD_LIMIT) overflow=card.getComponent(CardControl).baseData.id;
                    let obj:Object={overflow:overflow};
                    if(myself){
                        obj={id:card.getComponent(CardControl).baseData.id,uid:uid,overflow:overflow}
                    }
                    this.effectGetCard(obj,myself);

                    // c.setPosition(hposX,0);
                    this.removeTableCard(uid,myself);
                }).
                start();
                break;
            }
        }
    }
    //移除手牌  index 换成 uid 
    removeHandCard(uid:number,myself:boolean=true){
        let node=this.node.getChildByName(myself?"Bottom":"Top");
        let targetCard;
        let index=-1;
        let num=0
        for(const card of node.children){
            // if(card.getComponent(CardControl).index==index){
            //     card.removeFromParent();
            // }
            console.log(num++,uid,"对比uid",card.getComponent(CardControl).uid)
            if(card.getComponent(CardControl).uid==uid){
                targetCard=card;
                index=card.getComponent(CardControl).index;
                // card.removeFromParent();
                card.removeFromParent();
            }
        }    
        if(index==-1){
            console.log("移除手牌 没找到对应Uid 有BUG？？？？？？？？？？？？？？？？？？");
            return;
        }
        for(const card of node.children){
            if(card.getComponent(CardControl).index>index){
                card.getComponent(CardControl).index--;
            }
        }
        
        this.updateHandCardPos(myself);
        console.log("==removeHandCard 移除手牌后数量",node.children);
    }
    //获得卡牌逻辑
    effectGetCard(data:any,myself:boolean){
        
        let overflow=data.overflow;
        let value=myself?1:-1;
        // let posX=-120*value;//-120
        // let posY=-40*value;//-40
        let hposX=180*value;//手牌最后一张的坐标
        let handPosition=new Vec3(hposX,0);
        // let rNode= this.node.getChildByName(myself?"RightBottom":"LeftTop");
        let hNode=this.node.getChildByName(myself?"Bottom":"Top");

        let c= instantiate(this.Card);
        // c.setPosition(305*value,40*value);//牌组坐标
        c.setPosition(hposX,0);
        c.getComponent(CardControl).initData(myself?1:11,data.overflow?data.overflow:data.id,data.uid,hNode.children.length);//data.overflow?0:data.uid
        c.getComponent(CardControl).initParent(hNode);

        if(data.overflow){
            tween(c).
            // to(0.3,{position:handPosition}).
            to(0.7,{position:new Vec3(hposX,200*value)}).
            call(() => { 
                console.log("手牌满了",overflow);
                // Toast.toast("手牌数量达到上限！");
                c.removeFromParent();
            }).
            start();
        }else{
            tween(c).to(0,{position:handPosition}).
            call(() => { 
                c.setPosition(hposX,0);
                this.updateHandCardPos(myself); 
            }).
            start();
        }
    }
    //抽牌逻辑
    drawCard(data:any,myself:boolean=true){
        AudioManager.inst.playOneShot("audio/draw_card");
        let overflow=data.overflow;
        let value=myself?1:-1;
        let posX=-120*value;//-120
        let posY=-40*value;//-40
        let hposX=180*value;//手牌最后一张的坐标
        let handPosition=new Vec3(hposX,0);
        let rNode= this.node.getChildByName(myself?"RightBottom":"LeftTop");
        let hNode=this.node.getChildByName(myself?"Bottom":"Top");

        let c= instantiate(this.Card);
        c.setPosition(305*value,40*value);
        c.getComponent(CardControl).initData(myself?1:11,data.overflow?data.overflow:data.id,data.overflow?0:data.uid,hNode.children.length);
        c.getComponent(CardControl).initParent(hNode);

        //剩余卡牌数量变化
        let remainNode=this.node.getChildByName(myself?"RightBottom":"LeftTop");
        remainNode.removeChild(remainNode.children[remainNode.children.length-1]);
        if(remainNode.children.length<=3){
            Toast.toast("卡组只剩"+remainNode.children.length+"张卡了!!!");
        }
        this.updateRemainCardNum(myself);

        //手牌满了效果
        if(data.overflow){
            tween(c).to(0.3,{position:handPosition}).
            to(0.7,{position:new Vec3(hposX,200*value)}).
            call(() => { 
                console.log("手牌满了",overflow);
                // Toast.toast("手牌数量达到上限！");
                c.removeFromParent();
            }).
            start();
        }else{
            tween(c).to(0.3,{position:handPosition}).
            call(() => { 
                c.setPosition(hposX,0);
                // c.setParent(hNode);
                this.updateHandCardPos(myself); 
            }).
            start();
        }
    }
    updateRemainCardNum(myself:boolean=true){
        let remainNode=this.node.getChildByName(myself?"RightBottom":"LeftTop");
        let label=this.node.getChildByName(myself?"RightBottomUI":"LeftTopUI").getChildByName("LbCardNum").getComponent(Label);
        label.string=String(remainNode.children.length);
        let value=myself?1:-1;
        label.node.setPosition((5+0.4*(remainNode.children.length-1))*value,0.4*(remainNode.children.length-1));
    }
    //召唤卡牌 放置陷阱卡
    addTableCard(data:any,updateType:number,myself:boolean=true){
        let value=myself?1:-1;
        let c= instantiate(this.Card);
        let cardControl=c.getComponent(CardControl);
        // c.setParent(this.cardTable);
        cardControl.initData(myself?2:12,data.id,data.uid,this.getTableCardList(updateType,myself).length);
        cardControl.initParent(this.cardTable);
        if(data)    cardControl.updateData(data);
        c.setScale(1.5,1.5);
        tween(c).to(0.2,{scale:new Vec3(1,1,1)}).// delay(dTime).
            call(() => { 
                // c.removeFromParent();
            }).start();
        this.updateTableCardPos(updateType,myself);
    }
    //获取满足条件的卡范围
    getCardPool(effect:any){
        let arr=[];
        // let rNode= this.node.getChildByName(myself?"RightBottom":"LeftTop");
        // let hNode=this.node.getChildByName(myself?"Bottom":"Top");
        // this.cardTable
        if(effect.obj==1||effect.obj==3){
            if(effect.pos==1){
                arr=arr.concat(this.node.getChildByName("Bottom").children);
            }else if(effect.pos==2){
                arr=arr.concat(this.getTableCardList(0));
            }else if(effect.pos==3){
                arr=arr.concat(this.node.getChildByName("RightBottom").children);
            }
        }
        if(effect.obj==2||effect.obj==3){
            if(effect.pos==1){
                arr=arr.concat(this.node.getChildByName("Top").children);
            }else if(effect.pos==2){
                arr=arr.concat(this.getTableCardList(0,false));
            }else if(effect.pos==3){
                arr=arr.concat(this.node.getChildByName("LeftTop").children);
            }
        }
        return arr;
    }
    //获取场上的卡牌 cardType 1武将卡 2魔法陷阱  0 所有
    getTableCardList(cardType:number,myself:boolean=true):any[]{
        let arr=[];
        for(const card of this.cardTable.children){
            if(card.getComponent(CardControl).posType==(myself?2:12)){//card.getComponent(CardControl).baseData &&
                if(cardType==0){
                    arr.push(card);
                }else if(cardType==1){
                    if(card.getComponent(CardControl).baseData&&card.getComponent(CardControl).baseData.cardType==1){
                        arr.push(card);
                    }
                }else{
                    //魔法陷阱卡 放置的可能没有baseData数据 需要特殊判断
                    if(!card.getComponent(CardControl).baseData||card.getComponent(CardControl).baseData.cardType>1){
                        arr.push(card);
                    }
                }
            }
        }
        return arr;
    }
    getTableCardByUID(uid:number):Node{
        for(const card of this.cardTable.children){
            if(card.getComponent(CardControl).uid==uid){
                return card;
            }
        }  
        console.log("=============>是否有BUG  getTableCardByUID没找到card",uid);
        return null;  
    }
    getTableCardByID(id:number,myself:boolean=true):any[]{
        let arr=[];
        for(const card of this.cardTable.children){
            if(card.getComponent(CardControl).posType==(myself?2:12)){
                if(card.getComponent(CardControl).baseData&&card.getComponent(CardControl).baseData.id==id){
                    arr.push(card);
                }
            }
        }  
        console.log("=============>根据id 没找到card",id);
        return arr;  
    }
    //确定按钮 返回主页
    onBtConfirm(){
        AudioManager.inst.playOneShot("audio/bt_back");
        director.loadScene("hall");
    }
    //HP改变
    updateHP(value:number,myself:boolean=true){
        if(value>0){
            AudioManager.inst.playOneShot("audio/hp");
        }else if(value<0){
            AudioManager.inst.playOneShot("audio/hp1");
        }
        //后续加减特效
        if(myself){
            this.hp+=value;
        }else{
            this.hpOther+=value;
        }
        let node=this.node.getChildByName(myself?"LeftBottom":"RightTop");
        Toast.tip(String(value>=0?("+"+value):value),node.position);
        node.getChildByName("LbHP").getComponent(Label).string=String(myself?this.hp:this.hpOther);
    }
    showHP(value:number,myself:boolean=true){
        if(myself){
            this.hp=value;
        }else{
            this.hpOther=value;
        }
        let node=this.node.getChildByName(myself?"LeftBottom":"RightTop");
        // Toast.tip(String(value>=0?("+"+value):value),node.position);
        node.getChildByName("LbHP").getComponent(Label).string=String(myself?this.hp:this.hpOther);
    }
    //攻击结束回调
    attackCompleteCall(card:Node,myself:boolean,pos:Vec3){
        if(card){
            let cControl=card.getComponent(CardControl);
            // console.log("========》call回调1",cControl.state);
            if(cControl.state==2){//状态2 动效完成后破坏卡牌   弃用了暂时
                // tween(card).to(0.2,{position:posTarget}).
                // tween(card).hide().delay(1).show().

                // tween(card).delay(0.5).
                // call(() => { 
                    let cType=cControl.baseData.cardType;
                    let index=cControl.index;
                    card.removeFromParent();
                    for(const cardT of this.cardTable.children){
                        let cardC=cardT.getComponent(CardControl);
                        //攻击暂时只需要判断 武将卡 调整
                        if(cardC.baseData&&(cardC.baseData.cardType==cType||(cardC.baseData.cardType>1&&cType>1))&&cardC.posType==(myself?2:12)&&cardC.index>index){
                            cardC.index--;
                        }
                    }
                    this.updateTableCardPos(cType,myself);
                    console.log(cControl.uid,index,"攻击动效结束2 被破坏卡",cType,myself);
                // }).start();
            }
            else{
                card.setPosition(pos);
                cControl.state=0;
            }
        }else{
            console.log("=====attackCompleteCall   card不存在 是否有BUG？？？？？？？？？？？？？？")
        }
    }
    //添加buff
    addBuff(uid:number,buffUid:number,buffId:number,myself:boolean,value:number){
        console.log(uid,buffId,"addBuff>>",this.getTableCardByUID(uid))
        let cardControl=this.getTableCardByUID(uid).getComponent(CardControl);
        cardControl.addBuff(buffUid,buffId,value);
    }
    //移除Buff value 1攻击显示圣盾效果
    removeBuff(uid:number,buffUid:number,myself:boolean,value:number){
        let cardControl=this.getTableCardByUID(uid).getComponent(CardControl);
        cardControl.removeBuff(buffUid);
        if(value) cardControl.buffEffect(String(GameConfig.BUFF_SHIELD),1);
    }
    //重置武将通常召唤次数  重置攻击次数
    initUseGeneralTimes(){
        // this.roomData["one"].useGeneralTimes=1;
        // this.roomData["two"].useGeneralTimes=1;
        this.useGeneralTimes=1;
        this.initAttackCount();//初始化攻击次数
    }
    //重置攻击次数
    initAttackCount(){
        let cardList= this.getTableCardList(1);
        for(let i=0;i<cardList.length;i++){
            let cardOne=cardList[i];
            cardOne.getComponent(CardControl).initAttackCount();
        }
    }
    //显示回合倒计时时间
    showTurnCountDown(time:number=-1){
        this.unschedule(this.countDown);
        this.countDownTime=time>0?time:GameConfig.TURN_TIME;
        let lbC=this.node.getChildByName("UICenter").getChildByName("LbCountdown").getComponent(Label);
        lbC.string=String(this.countDownTime);
        lbC.color=this.myTurn?new Color(104,150,128):new Color(209,144,128); 
        this.schedule(this.countDown,1,this.countDownTime);
    }
    //显示隐藏富文本按钮
    //显示隐藏面板
    onBtShowRichText(e:EventTouch){
        AudioManager.inst.playOneShot("audio/bt_back");
        let actShow=this.node.getChildByName("ActShow");
        let lb=actShow.getChildByName("BtShow").getChildByName("Label").getComponent(Label);
        lb.string=lb.string=="显"?"隐":"显";
        actShow.getChildByName("RichText").active=!actShow.getChildByName("RichText").active;
        actShow.getChildByName("RichTextBg").active=!actShow.getChildByName("RichTextBg").active;
    }
    //加入富文本
    addRichText(id:number,myself:boolean){
        let btShow=this.node.getChildByName("ActShow").getChildByName("BtShow");
        if(this.actString=="") btShow.active=true;

        let baseData:any=GameConfig.getCardDataById(id);
        let newStr=this.actString==""?"":"<br/>";
        newStr+=myself?"我":"<color=#ff>敌</color>";
        // newStr+=baseData.cardName;
        if(id){
            newStr+="<u><i><b><color="+GameConfig.COLOR_RARE16[baseData.rare]+" click='cardClick' param='"+baseData.id+"'>"+baseData.cardName+"</color></b></i></u>";
        }else{
            newStr+="<u><i><b><color="+GameConfig.COLOR_RARE16[3]+" click='cardClick' param='"+0+"'>"+"陷阱卡"+"</color></b></i></u>";
        }
        
        this.actString+=newStr;
        let arr=this.actString.split("<br/>");
        if(arr.length==11){
            this.actString=this.actString.slice(this.actString.indexOf("<br/>")+5);
        }
        this.node.getChildByName("ActShow").getChildByName("RichText").getComponent(RichText).string=this.actString;
        let h=(arr.length>10?10:arr.length)*28.5;
        this.node.getChildByName("ActShow").getChildByName("RichTextBg").getComponent(UITransform).height=h;
        btShow.setPosition(btShow.position.x,h+50);
        // console.log(id,"富文本",arr);
    }
    showRichTextCard(value:string){
        console.log("显示富文本卡牌",value);
        let id=parseInt(value);
        if(id==0){
            // Toast.showTip("陷阱卡(对方回合满足条件会触发)");
            return;
        }

        let leftNode=this.node.getChildByName("CardShow").getChildByName("leftShowCard");
        if(leftNode){
            leftNode.getComponent(CardControl).changeData(id,0);
            leftNode.active=true;
        }else{
            let c= instantiate(this.Card);
            let node=this.node.getChildByName("CardShow");
            c.name="leftShowCard";
            c.setPosition(60-view.getVisibleSize().x/2,-250);
            // c.setParent(this.node.getChildByName("CardShow"));
            c.getComponent(CardControl).initData(0,id,0,node.children.length);
            c.getComponent(CardControl).initParent(this.node.getChildByName("CardShow"));
        }
        
        // tween(c).to(0.3,{scale:new Vec3(1.1,1.1,1)}).
        // delay(dTime).
        // call(() => { 
        //     c.removeFromParent();
        // }).
        // start();
    }

    //显示陷阱卡发动效果
    showTrapCard(uid:number,id:number){
        console.log(uid,"<<<陷阱卡发动啦",id)
        let card=this.getTableCardByUID(uid);
        let c= instantiate(this.Card);
            let node=this.node.getChildByName("CardShow");
            c.setPosition(card.position);//0,view.getVisibleSize().y/2-150
            // c.setParent(this.node.getChildByName("CardShow"));
            c.getComponent(CardControl).initData(0,id,0,node.children.length);
            c.getComponent(CardControl).initParent(this.node.getChildByName("CardShow"));
            let dTime=1.2;
            // if(data.id>20000&&data.id<30000) dTime=1.2;
            tween(c).to(0.2,{scale:new Vec3(1.1,1.1,1)}).
            delay(dTime).
            call(() => { 
                c.removeFromParent();
            }).
            start();
    }
    //===================服务器消息事件处理
    //重连成功
    reqConnected(data:any){
        console.log("游戏中 服务器重连成功",data);
        Toast.alertHide();
        // if(this.node.getChildByName("Alert")){
        //     this.node.getChildByName("Alert").active=false;
        // }
        //此处有BUG 应该等待重连完成socket存在再发送game_ready
        this.sendGameReady();    
    }
    reqDisconnect(data:any){
        Toast.alert("网络异常 断开连接",false,()=>{
            director.loadScene("login");
        });
        // let al= instantiate(this.Alert);
        // console.log(al.name,"服务器断开连接",data,al);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show("网络异常 断开连接",false,()=>{
        //     director.loadScene("login");
        // });
        // al.setParent(this.node);
    }
    reqGameStart(data:any){
        console.log("服务器匹配成功事件 游戏开始",data);
        this.first=data.first;
        this.gameState=data.gameState;
        this.node.getChildByName("RightTop").getChildByName("LbName").getComponent(Label).string=data.otherName;
        this.node.getChildByName("ChangeCardShow").getChildByName("LabelFirst").getComponent(Label).string=this.first?"你是先攻":"你是后攻";
        this.node.getChildByName("ChangeCardShow").active=true;
        this.node.getChildByName("WaitUI").active=false;
    }
    reqGameData(data:any){
        console.log("游戏重连数据",data);
        Tween.stopAll();
        this.first=data.first;
        this.gameState=data.gameState;
        this.myTurn=data.myTurn;
        this.turnCount=data.turn;
        this.showHP(data.hp);
        this.showHP(data.otherHP,false);
        this.useGeneralTimes=data.useGeneralTimes;
        this.changeHand=data.changeHand;
        //回合相关
        this.node.getChildByName("UICenter").getChildByName("BtTurnEnd").active=data.myTurn;
        this.node.getChildByName("UICenter").getChildByName("LbOtherTurn").active=!data.myTurn;
        if(this.gameState>2)    this.showTurnCountDown(data.turnTime);//判断是否换手牌阶段

        this.node.getChildByName("RightTop").getChildByName("LbName").getComponent(Label).string=data.otherName;
        //换手牌重连逻辑 需要添加
        if(this.gameState==2){
            this.node.getChildByName("ChangeCardShow").getChildByName("LabelFirst").getComponent(Label).string=this.first?"你是先攻":"你是后攻";
            this.node.getChildByName("ChangeCardShow").active=true;
            if(data.changeHand){
                this.node.getChildByName("ChangeCardShow").getChildByName("BtConfirm").active=false;
                this.node.getChildByName("ChangeCardShow").getChildByName("LbResult").active=true;
            }
        }
        // this.node.getChildByName("ChangeCardShow").getChildByName("LabelFirst").getComponent(Label).string=this.first?"你是先攻":"你是后攻";
        // this.node.getChildByName("ChangeCardShow").active=true;
        this.node.getChildByName("WaitUI").active=this.gameState<2;

        this.initCard(data.cardData);
    }
    reqCardInfo(data:any){
        console.log("服务器卡牌信息事件 卡牌信息",data);
        this.initCard(data);
    }
    reqGameOver(data:any){
        // AudioManager.inst.playOneShot("audio/card_magic");
        console.log("服务器游戏结束事件 游戏结束",data);
        this.unschedule(this.countDown);
        let node=this.node.getChildByName(data.result==1?"WinUI":"LoseUI");
        node.active=true;
        let str=data.result==1?"对手":"";
        if(data.winType==1) str+="士气为0";
        else if(data.winType==2) str+="无卡可抽";
        else if(data.winType==3) str+="投降";
        node.getChildByName("LbResult").getComponent(Label).string=str;
    }
    reqError(data:any){
        console.log("服务器游戏错误信息",data);
        Toast.alert(data.msg,false,()=>{
            director.loadScene("hall");
        });
        // let al= instantiate(this.Alert);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show(data.msg,false,()=>{
        //     director.loadScene("hall");
        // });
        // al.setParent(this.node); 
    }
    reqGameDissolve(data:any){
        console.log("服务器游戏解散事件 游戏解散",data);
        Toast.alert("由于玩家长时间没准备 游戏解散！",false,()=>{
            director.loadScene("hall");
        });
        // let al= instantiate(this.Alert);
        // let aControl=al.getComponent(AlertControl);
        // aControl.show("由于玩家长时间没准备 游戏解散！",false,()=>{
        //     director.loadScene("hall");
        // });
        // al.setParent(this.node);
    }
    reqDraw(data:any){
        console.log("服务器抽卡事件 抽卡",data);
        this.drawCard(data);
    }
    reqDrawOther(data:any){
        console.log("服务器对手抽卡事件 对方抽卡",data);
        this.drawCard(data,false);
    }
    reqTurnStart(data:any){
        console.log("服务器回合开始事件 回合开始",data);
        if(data.myTurn){
            AudioManager.inst.playOneShot("audio/myturn");
        }
        let dt=0.4;
        if(this.gameState==2){//换牌状态特殊处理
            dt=1;
            this.gameState=3;
            this.node.getChildByName("ChangeCardShow").active=false;
            let handNode=this.node.getChildByName("Bottom");
            let changeNode=this.node.getChildByName("ChangeCardShow").getChildByName("NodeCard");
            for(let i=0;i<GameConfig.HANDCARD_COUNT;i++){   
                changeNode.children[0].setParent(handNode)//设置parent为ChangeCardShow
            }
            this.updateHandCardPos();
        }

        let lbNode=this.node.getChildByName("UIShow").getChildByName("LbMyturn");
        let lb=lbNode.getComponent(Label);
        lb.string=data.myTurn?"我的回合":"对方回合";
        lb.color=data.myTurn?new Color(104,150,128):new Color(209,144,128); //"#68967E":"#D19080"
        lbNode.setPosition(lbNode.position.x,data.myTurn?-80:80);
        lbNode.setScale(new Vec3(2,2));
        lbNode.active=true;
        tween(lbNode).to(0.3,{scale:new Vec3(1,1,1)}).
            delay(dt).
            call(() => { 
                lbNode.active=false;
            }).start();

        this.myTurn=data.myTurn;
        
        //回合数+1
        this.turnCount++;
        //回合开始逻辑处理  重置通招次数 攻击次数
        this.initUseGeneralTimes();

        // this.node.getChildByName("UICenter").getChildByName("BtSurrender").active=data.myTurn;
        this.node.getChildByName("UICenter").getChildByName("BtTurnEnd").active=data.myTurn;
        this.node.getChildByName("UICenter").getChildByName("LbOtherTurn").active=!data.myTurn;
        
        this.showTurnCountDown();
    }
    //useType 1通招 2特招 3陷阱 0魔法
    reqCardUsed(data:any){
        console.log("服务器卡牌使用事件 卡牌使用",data);
        this.removeHandCard(data.uid,data.isMe);
        if(data.id>20000&&data.id<30000) {
            AudioManager.inst.playOneShot("audio/card_magic");
        } 
        if(data.isMe){
            console.log("我方通招成功 通招次数-1")
            if(data.useType==1) this.useGeneralTimes--;
        }else{
            let c= instantiate(this.Card);
            let node=this.node.getChildByName("CardShow");
            c.setPosition(0,view.getVisibleSize().y/2-150);
            // c.setParent(this.node.getChildByName("CardShow"));
            c.getComponent(CardControl).initData(0,data.id,0,node.children.length);
            c.getComponent(CardControl).initParent(this.node.getChildByName("CardShow"));
            let dTime=0.7;
            if(data.id>20000&&data.id<30000) {
                dTime=1.2;
            }    
            tween(c).to(0.3,{scale:new Vec3(1.1,1.1,1)}).
            delay(dTime).
            call(() => { 
                c.removeFromParent();
            }).
            start();
        }
        //加入左侧富文本
        this.addRichText(data.id,data.isMe);

    }
    reqCardAttack(data:any){
        console.log("服务器卡牌攻击事件 卡牌攻击",data);
        let card=this.getTableCardByUID(data.uid);
        let target=this.getTableCardByUID(data.target);//target不存在 直接攻击
        let myself=data.isMe;
        //攻击次数-1
        card.getComponent(CardControl).changeAttackCount();
        //攻击动效
        card.getComponent(CardControl).state=1;
        let pos=new Vec3(card.position.x,card.position.y);
        let posTarget:Vec3;
        if(target){
            AudioManager.inst.playOneShot("audio/attack");
            target.getComponent(CardControl).state=1;
            posTarget=new Vec3(target.position.x,target.position.y+(myself?-180:180));
        }else{
            AudioManager.inst.playOneShot("audio/attack_direct");
            posTarget=new Vec3(0,myself?360:-360);
            //直接攻击文字效果
            let lbNode=this.node.getChildByName("UIShow").getChildByName("LbTip");
            let lb=lbNode.getComponent(Label);
            // lb.string=myself?"直接攻击":"对方直接攻击";
            lb.color=myself?new Color(104,150,128):new Color(209,144,128); //"#68967E":"#D19080"
            // lbNode.setPosition(lbNode.position.x,myself?-80:80);
            // lbNode.setScale(new Vec3(2,2));
            lbNode.active=true;
            tween(lbNode).to(0.2,{scale:new Vec3(1.2,1.2,1)}).
                to(0.2,{scale:new Vec3(1,1,1)}).
                // delay(0.1).
                call(() => { 
                    lbNode.active=false;
                }).start();
    
        }
        
        //攻击卡牌置顶
        card.getComponent(CardControl).initIndex=card.getSiblingIndex();
        card.setSiblingIndex(card.getParent().children.length);
        //tween动效
        tween(card).to(0.2,{position:posTarget}).
        // delay(1).
        call(() => { 
            card.setSiblingIndex(card.getComponent(CardControl).initIndex);
            this.attackCompleteCall(card,myself,pos);//攻击结束回调
            // if(target)this.attackCompleteCall(target,!myself,target.position);//攻击结束回调
            
        }).start();
        
        
    }
    //isMe  uid   value卡牌信息    updateType(3 2 1 0 -1 -2 -3 -4 -5 ) 1召唤武将 2获得 3放置陷阱 0 -1破坏 -2返回手卡 -3返回卡组 -4陷阱卡发动 -5守护 
    reqCardUpdate(data:any){
        console.log(">>>>服务器卡牌更新事件 卡牌更新",data);
        if(data.updateType==1){
            AudioManager.inst.playOneShot("audio/card_enter");
            this.addTableCard(data.value,1,data.isMe);
        }else if(data.updateType==-1){
            console.log(data.uid,"卡牌破坏",data.isMe);
            let removeCard=this.getTableCardByUID(data.uid).getComponent(CardControl);
            let dt:number=0.2;
            if(!removeCard.baseData){//处理消失效果 陷阱卡被破坏 显示卡牌
                console.log("显示陷阱卡？？",data.value.id)
                removeCard.changeData(data.value.id,data.uid);
                dt=0.4;
            }else{
                if(removeCard.baseData.cardType==1){//武将死亡音效
                    AudioManager.inst.playOneShot("audio/death1"+(Math.random()<0.5?1:2));
                }
            }
            removeCard.disappear();//闪白shader
            tween(removeCard).delay(dt).hide().delay(0.1).show().delay(0.1).hide().delay(0.1).show().start();
            let callTime:number=setTimeout(()=>{
                this.removeTableCard(data.uid,data.isMe);
            },800)
            // this.removeTableCard(data.uid,data.isMe);
            

        }else if(data.updateType==-2){
            console.log(data.uid,"卡牌返回手卡",data.isMe);
            this.tableToHand(data.uid,data.isMe);
        }else if(data.updateType==-3){
            console.log(data.uid,"卡牌返回卡组",data.isMe);
            this.tableToRemain(data.uid,data.isMe);
        }else if(data.updateType==-4){
            console.log(data.uid,"陷阱卡发动效果",data.isMe);
            AudioManager.inst.playOneShot("audio/trap_show");
            this.showTrapCard(data.value.uid,data.value.id);
            
            let callTime:number=setTimeout(()=>{
                this.removeTableCard(data.uid,data.isMe);
            },1200)
            // this.removeTableCard(data.uid,data.isMe);
            //加入左侧富文本
            this.addRichText(data.value.id,data.isMe);
        }else if(data.updateType==-5){
            let protectCard=this.getTableCardByUID(data.uid).getComponent(CardControl);
            protectCard.buffEffect(String(GameConfig.BUFF_PROTECT),1);
        }else if(data.updateType==3){
            console.log(data.uid,"卡牌使用",data.isMe);
            AudioManager.inst.playOneShot("audio/trap_use");
            this.addTableCard(data.value,3,data.isMe);
        }else if(data.updateType==4){
            // console.log(data.uid,"陷阱卡效果发动",data.isMe);
            //处理发动显示效果
            // this.removeTableCard(data.uid,data.isMe);
        }
        else if(data.updateType==2){
            console.log(data.uid,"获得卡",data.isMe,data.value);
            //从卡组获得 卡组要减少
            if(data.pos==3){
                this.removeRemainCard(data.isMe);
            }
            //生成获得卡牌数据
            let overflow=0;//满出的手牌id
            let hNode=this.node.getChildByName(data.isMe?"Bottom":"Top");
            let cardNum=hNode.children.length;
            // return;//暂时未完成
            if(cardNum>=GameConfig.HANDCARD_LIMIT) overflow=data.value.id;
            let obj:Object={overflow:overflow};
            if(data.isMe){
                obj={id:data.value.id,uid:data.uid,overflow:overflow};
            }
            this.effectGetCard(obj,data.isMe);
        }
    }
    reqBuffUpdate(data:any){
        //isMe: true, uid: 242,buffUid, buffId: 102, updateType: -1,value:0
        console.log("服务器BUff事件 BUFF更新",data);
        if(data.updateType==1){
            this.addBuff(data.uid,data.buffUid,data.buffId,data.isMe,data.value);
        }else if(data.updateType==-1){
            console.log(data.uid,"buff移除",data.isMe);
            this.removeBuff(data.uid,data.buffUid,data.isMe,data.value);
        }
        
    }
    reqHPUpdate(data:any){
        console.log("服务器P变化事件 HP变化",data);
        if(data.hp==0) return;
        this.updateHP(data.hp,data.isMe);
    }
    reqCardChangeHand(data:any){
        console.log("服务器更换手牌事件 ",data);
        this.changeHand=true;
        this.node.getChildByName("ChangeCardShow").getChildByName("BtConfirm").active=false;
        this.node.getChildByName("ChangeCardShow").getChildByName("LbResult").active=true;
        let changeNode=this.node.getChildByName("ChangeCardShow").getChildByName("NodeCard");
        for(const changeCard of changeNode.children){
            let redCrossNode=this.node.getChildByName("ChangeCardShow").getChildByName(String(changeCard.getComponent(CardControl).uid));
            if(redCrossNode){
                console.log("<<<<<<<<<<<<<<<<<<<<<<移除红叉");
                redCrossNode.removeFromParent();
            }    
        }    
        let hNode=this.node.getChildByName("RightBottom");
        for(let i=0;i<data.cardList.length;i++){
            let uid=data.cardList[i];
            let cardNew=data.newList[i];
            if(uid){
                for(const changeCard of changeNode.children){
                    if(changeCard.getComponent(CardControl).uid==uid){
                        let initPos=new Vec3(changeCard.position.x,changeCard.position.y);
                        tween(changeCard).
                        // to(0.3,{position:handPosition}).
                        to(0.3,{position:hNode.position}).
                        to(0.1,{scale:new Vec3(0, 0, 0)}).
                        call(() => { 
                            console.log("返回tween结束 更换卡牌数据 抽牌tween");
                            changeCard.getComponent(CardControl).changeData(cardNew.id,cardNew.uid);
                        }).
                        to(0.1,{scale:new Vec3(1, 1, 1)}).
                        to(0.3,{position:initPos}).
                        call(() => { 
                            console.log("抽牌tween完成");
                        }).
                        start();
                    }
                }
                // let changeCard=this.node.getChildByName("ChangeCardShow").getChildByName(String(card));
            }
        }

    }

    //触摸事件
    onTouchStart(e:EventTouch){
        console.log("onTouchStart《《《《《《《《《《《《《《《《测试触摸事件");
        // Toast.showTip("测试tip",new Vec3(e.getUILocation().x,e.getUILocation().y));
        // Toast.hideTip();
    }    
    onTouchEnd(e:EventTouch){
        console.log("hide TIP onTouchEnd《《《《《《《《《《《《《《《《测试触摸事件 ");
        Toast.hideTip();
        let node=this.node.getChildByName("CardShow").getChildByName("leftShowCard");
        if(node) node.active=false;
    } 
    onTouchCancel(e:EventTouch){
        console.log("hide TIP onTouchCancel《《《《《《《《《《《《《《《《测试触摸事件 ");
        Toast.hideTip();
    }  
    
}


