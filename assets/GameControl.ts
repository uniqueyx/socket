import { _decorator, Component, Node, Prefab, instantiate, Vec3, Label, director, tween, view, Vec2, UITransform, Size, Rect, Color } from 'cc';
import GameConfig from './scripts/Base/GameConfig';
import GameEvent from './scripts/Base/GameEvent';
import { SocketIO } from './scripts/Base/SocketIO';
import Toast from './scripts/Base/Toast';
import { CardControl } from './scripts/CardControl';
const { ccclass, property } = _decorator;

@ccclass('GameControl')
export class GameControl extends Component {
    @property(Prefab)
    Card:Prefab;

    socketIO=null;

    cardTable:Node;

    countDownTime:number;
    myTurn:boolean;
    hp:number;
    hpOther:number;

    first:boolean;//是否先攻
    turnCount:number;//回合数
    useGeneralTimes:number;//武将通常召唤次数
    onLoad(){
        // GameEvent.Instance.on("match_success")
        this.socketIO=SocketIO.Instance;
        this.cardTable=this.node.getChildByName("CardTable");
        GameEvent.Instance.on("game_start",this.reqGameStart,this);
        GameEvent.Instance.on("card_info",this.reqCardInfo,this);
        GameEvent.Instance.on("game_over",this.reqGameOver,this);
        GameEvent.Instance.on("draw",this.reqDraw,this);
        GameEvent.Instance.on("draw_other",this.reqDrawOther,this);
        GameEvent.Instance.on("turn_start",this.reqTurnStart,this);
        GameEvent.Instance.on("card_used",this.reqCardUsed,this);
        GameEvent.Instance.on("card_attack",this.reqCardAttack,this);
        GameEvent.Instance.on("card_update",this.reqCardUpdate,this);
        GameEvent.Instance.on("buff_update",this.reqBuffUpdate,this);
        GameEvent.Instance.on("hp_update",this.reqHPUpdate,this);
        //游戏事件
        GameEvent.Instance.on("updateCardIndex",this.updateCardIndex,this);
        
        // if(this.Card)   {
        // if(this.Card)   {
        // if(this.Card)   {
        // if(this.Card)   {
        // if(this.Card)   {
        //     let ca= instantiate(this.Card);
        // }    
        //发送准备开始消息
        this.socketIO.socket.emit("GAME", {
            type: "game_ready",
            user: this.socketIO.userID
        });
        this.initUI();
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
        GameEvent.Instance.off("game_start",this.reqGameStart,this);
        GameEvent.Instance.off("card_info",this.reqCardInfo,this);
        GameEvent.Instance.off("game_over",this.reqGameOver,this);
        GameEvent.Instance.off("draw",this.reqDraw,this);
        GameEvent.Instance.off("draw_other",this.reqDrawOther,this);
        GameEvent.Instance.off("turn_start",this.reqTurnStart,this);
        GameEvent.Instance.off("card_used",this.reqCardUsed,this);
        GameEvent.Instance.off("card_attack",this.reqCardAttack,this);
        GameEvent.Instance.off("card_update",this.reqCardUpdate,this);
        GameEvent.Instance.off("buff_update",this.reqBuffUpdate,this);
        GameEvent.Instance.off("hp_update",this.reqHPUpdate,this);
    }
    start() {
        console.log("gamecontrol  start触发")
        // let scene=director.getScene();
        console.log("init gamecontrol  start",this.Card);
        
    }

    test(){
        console.log('test>>',this.Card)
        director.loadScene("gameScene");
    }
    judgeTest(){
        console.log("judgeTest")
    }


    update(deltaTime: number) {
        
    }

    //==================方法
    initUI(){
        this.useGeneralTimes=1;
        this.turnCount=0;
        this.hp=GameConfig.INIT_HP;
        this.hpOther=GameConfig.INIT_HP;
        this.node.getChildByName("LeftBottom").getChildByName("LbName").getComponent(Label).string=this.socketIO.userID;
        this.node.getChildByName("LeftBottom").getChildByName("LbHP").getComponent(Label).string=String(GameConfig.INIT_HP);
        this.node.getChildByName("RightTop").getChildByName("LbHP").getComponent(Label).string=String(GameConfig.INIT_HP);
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
        this.socketIO.socket.emit("GAME", {
            type: "turn_end",
            user: this.socketIO.userID
        });
    }
    //投降
    onBtSurrender(){
        console.log("发送 投降");
        this.socketIO.socket.emit("GAME", {
            type: "game_surrender",
            user: this.socketIO.userID
        });
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
                if(effect.noself==1)
                continue;//破坏卡默认排除自身 判断301破坏 401添加buff 501
            }    
            if(this.judgeCondition("cardType",effect.cardType,cardPoolOne.baseData.cardType)&&this.judgeCondition("force",effect.force,cardPoolOne.baseData.force)&&
            this.judgeCondition("rare",effect.rare,cardPoolOne.baseData.rare)&&this.judgeCondition("name",effect.name,cardPoolOne.baseData.name)&&
            this.judgeCondition("atk",effect.atk,effect.pos==4?cardPoolOne.baseData.attack:cardPoolOne.getAttack()) ){
                cardPoolNew.push(cardPoolOne);
            }
        }
        return cardPoolNew;
    }
    //条件判断
    judgeCondition(key:string,condition:any,value:any){
        if(condition==undefined) return true;//属性不存在跳过判断直接返回true
        switch(key){
            case "cardType":
                if(String(condition).indexOf(String(value))!=-1) return true;
                break;
            case "force": 
            case "rare":
            case "name":
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
        
        //发送使用卡牌消息
        SocketIO.Instance.socket.emit("GAME", {
            type: "card_use",
            user: SocketIO.Instance.userID,
            index:cardControl.index,
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
        console.log(distance,"<<攻击长度");
        this.node.getChildByName("attackArrow").setPosition(startPos);
        this.node.getChildByName("attackArrow").getComponent(UITransform).setContentSize(new Size(distance<min?min:distance,arrowSize.height));
        let rotation = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        let angle=rotation/(Math.PI/180);  
        console.log(rotation,"<<<弧度箭头角度",angle);
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
            if(attackC.attackCount<=0){
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
        this.initHandCard(data.handCards);
        this.initRemainCard(data.remainCards);
        this.initHandCard(data.otherHandCards,false);
        this.initRemainCard(data.otherRemainCards,false);
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
        let arrNode=this.getTableCardList(1,myself);
        console.log("updateTableCardPos   getTableCardList 数组长度",arrNode.length);
        let width=720;
        let cardHalf=60;
        let cardNum=arrNode.length;
        
        let apart=10;//-cardHalf*2
        // if(cardNum>4) apart=(width-cardHalf*2)/(cardNum-1);
        let posY=cardType==1?-120:(-120-cardHalf*2-5);
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
            console.log(cardNum,card.getComponent(CardControl).uid,"数量",myself,"场上坐标>>",index,posX);
        }
    }
    //移除场上牌
    removeTableCard(uid:number,myself:boolean=true){
        let node=this.cardTable;
        let index=0;
        let cardType=1;
        for(const card of node.children){
            if(card.getComponent(CardControl).uid==uid){
                index=card.getComponent(CardControl).index;
                cardType=card.getComponent(CardControl).baseData.cardType;
                if(card.getComponent(CardControl).state==1){//攻击动效中 延迟移除
                    console.log(uid,"=======state设置成2",myself);
                    card.getComponent(CardControl).state=2;
                    return;
                }
                else card.removeFromParent();
            }
        }
        for(const card of node.children){
            let cardC=card.getComponent(CardControl);
            if((cardC.baseData.cardType==cardType||(cardC.baseData.cardType>1&&cardType>1))&&cardC.posType==(myself?2:12)&&cardC.index>index){
                cardC.index--;
            }
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
    //移除手牌
    removeHandCard(index:number,myself:boolean=true){
        let node=this.node.getChildByName(myself?"Bottom":"Top");
        for(const card of node.children){
            if(card.getComponent(CardControl).index==index){
                card.removeFromParent();
            }
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
        c.getComponent(CardControl).initData(myself?1:11,data.overflow?data.overflow:data.id,data.overflow?0:data.uid,hNode.children.length);
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
    }
    //召唤卡牌
    addTableCard(data:any,updateType:number,myself:boolean=true){
        let value=myself?1:-1;
        let c= instantiate(this.Card);
        // c.setParent(this.cardTable);
        c.getComponent(CardControl).initData(myself?2:12,data.id,data.uid,this.getTableCardList(1,myself).length);
        c.getComponent(CardControl).initParent(this.cardTable);
        if(data)    c.getComponent(CardControl).updateData(data);
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
            if(card.getComponent(CardControl).baseData &&card.getComponent(CardControl).posType==(myself?2:12)){
                if(cardType==0){
                    arr.push(card);
                }else if(cardType==1){
                    if(card.getComponent(CardControl).baseData.cardType==1){
                        arr.push(card);
                    }
                }else{
                    if(card.getComponent(CardControl).baseData.cardType>1){
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
    //确定按钮 返回主页
    onBtConfirm(){
        director.loadScene("gameScene");
    }
    //HP改变
    updateHP(value:number,myself:boolean=true){
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
    //攻击结束回调
    attackCompleteCall(card:Node,myself:boolean,pos:Vec3){
        if(card){
            let cControl=card.getComponent(CardControl);
            // console.log("========》call回调1",cControl.state);
            if(cControl.state==2){//状态2 动效完成后破坏卡牌

                // tween(card).to(0.2,{position:posTarget}).
                // tween(card).hide().delay(1).show().

                // tween(card).delay(0.5).
                // call(() => { 
                    let cType=cControl.baseData.cardType;
                    let index=cControl.index;
                    card.removeFromParent();
                    for(const cardT of this.cardTable.children){
                        let cardC=cardT.getComponent(CardControl);
                        if((cardC.baseData.cardType==cType||(cardC.baseData.cardType>1&&cType>1))&&cardC.posType==(myself?2:12)&&cardC.index>index){
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
    //移除Buff
    removeBuff(uid:number,buffUid:number,myself:boolean){
        let cardControl=this.getTableCardByUID(uid).getComponent(CardControl);
        cardControl.removeBuff(buffUid);
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
            cardOne.getComponent(CardControl).initAttackCount(1);
        }
    }
    //===================服务器消息事件处理
    reqGameStart(data:any){
        console.log("服务器匹配成功事件 游戏开始",data);
        this.first=data.first;
        this.node.getChildByName("RightTop").getChildByName("LbName").getComponent(Label).string=data.otherName;
    }
    reqCardInfo(data:any){
        console.log("服务器卡牌信息事件 卡牌信息",data);
        this.initCard(data);
    }
    reqGameOver(data:any){
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
        let lbNode=this.node.getChildByName("UIShow").getChildByName("LbMyturn");
        let lb=lbNode.getComponent(Label);
        lb.string=data.myTurn?"我的回合":"对方回合";
        lb.color=data.myTurn?new Color(104,150,128):new Color(209,144,128); //"#68967E":"#D19080"
        lbNode.setPosition(lbNode.position.x,data.myTurn?-80:80);
        lbNode.setScale(new Vec3(2,2));
        lbNode.active=true;
        tween(lbNode).to(0.3,{scale:new Vec3(1,1,1)}).
            delay(0.2).
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
        this.unschedule(this.countDown);
        this.countDownTime=GameConfig.TURN_TIME;
        let lbC=this.node.getChildByName("UICenter").getChildByName("LbCountdown").getComponent(Label);
        lbC.string=String(this.countDownTime);
        lbC.color=this.myTurn?new Color(104,150,128):new Color(209,144,128); 
        this.schedule(this.countDown,1,this.countDownTime);
    }
    
    reqCardUsed(data:any){
        console.log("服务器卡牌使用事件 卡牌使用",data);
        this.removeHandCard(data.index,data.isMe);
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
            if(data.id>20000&&data.id<30000) dTime=1.2;
            tween(c).to(0.3,{scale:new Vec3(1.1,1.1,1)}).
            delay(dTime).
            call(() => { 
                c.removeFromParent();
            }).
            start();
            
        }
    }
    reqCardAttack(data:any){
        console.log("服务器卡牌攻击事件 卡牌攻击",data);
        let card=this.getTableCardByUID(data.uid);
        let target=this.getTableCardByUID(data.target);//target不存在 直接攻击
        let myself=data.isMe;
        //攻击次数-1
        card.getComponent(CardControl).changeAttackCount(-1);
        //攻击动效
        card.getComponent(CardControl).state=1;
        let pos=new Vec3(card.position.x,card.position.y);
        let posTarget:Vec3;
        if(target){
            target.getComponent(CardControl).state=1;
            posTarget=new Vec3(target.position.x,target.position.y+(myself?-180:180));
        }else{
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
            if(target)this.attackCompleteCall(target,!myself,target.position);//攻击结束回调
            
        }).start();
        
        
    }
    //isMe  uid   value卡牌信息    updateType(3 2 1 0 -1 -2 -3) 1召唤武将 2获得 3放置陷阱 -1破坏 -2返回手卡 -3返回卡组 
    reqCardUpdate(data:any){
        console.log(">>>>服务器卡牌更新事件 卡牌更新",data);
        if(data.updateType==1){
            this.addTableCard(data.value,1,data.isMe);
        }else if(data.updateType==-1){
            console.log(data.uid,"卡牌破坏",data.isMe);
            this.removeTableCard(data.uid,data.isMe);
        }else if(data.updateType==-2){
            console.log(data.uid,"卡牌返回手卡",data.isMe);
            this.tableToHand(data.uid,data.isMe);
        }
        else if(data.updateType==-3){
            console.log(data.uid,"卡牌返回卡组",data.isMe);
            this.tableToRemain(data.uid,data.isMe);
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
            this.removeBuff(data.uid,data.buffUid,data.isMe);
        }
        
    }
    reqHPUpdate(data:any){
        console.log("服务器P变化事件 HP变化",data);
        this.updateHP(data.hp,data.isMe);
    }
}


