import { _decorator, Component, Node, NodeEventType, EventTouch, UITransform, Vec3, Label, Sprite, Prefab, instantiate, CCBoolean, SpriteFrame, resources, tween, TERRAIN_HEIGHT_BASE, Material } from 'cc';
import { GameControl } from '../GameControl';
import GameConfig from './Base/GameConfig';
import GameEvent from './Base/GameEvent';
import { SocketIO } from './Base/SocketIO';
import Toast from './Base/Toast';
const { ccclass, property } = _decorator;

@ccclass('CardControl')
export class CardControl extends Component {
    @property(Prefab)
    IconBuff:Prefab;

    baseData:any;
    initPos:Vec3;
    initIndex:number;//初始深度索引
    // owner:
    posType:number;//手牌,场上,卡组 1 2 3   11 12 13
    index:number;//卡牌索引位置0开始
    uid:number;//唯一id
    buffList:any[];//buff
    state:number;//1攻击动画中
    attackCount:number;//攻击次数
    attackedCount:number;//已攻击次数
    gameControl:GameControl;//游戏对战控制类

    //shader
    duration: number = 0.5;//0.5
    _median: number = 0;
    _time: number = 0;
    _material: Material = null!;
    onLoad(){
        // console.log("<<<<<<<<<<init card");
        this.node.getChildByName("CardBg").on(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.getChildByName("CardBg").on(NodeEventType.TOUCH_MOVE,this.onTouchMove,this);
        this.node.getChildByName("CardBg").on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.getChildByName("CardBg").on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
        
        this.node.getChildByName("ForceBg").on(NodeEventType.TOUCH_START,this.onForceTouchStart,this);
        
        return;
        //shader
        this._median = this.duration / 2;
        // 获取材质，此处获取的是共享材质，即所有使用同一个材质的组件，会同步修改
        // this._material = this.node.getChildByName("CardBg").getComponent(Sprite)!.getSharedMaterial(0)!;
        // 如果需要修改单一材质属性，那么通过 获取材质示例来修改
        this._material = this.node.getChildByName("CardBg").getComponent(Sprite)!.getMaterialInstance(0)!;//getSharedMaterialInstance
        // 设置材质对应的属性
        this._material.setProperty("u_rate", 1);
    }
    
    start() {
        // console.log("card start>>>>>>>>>>>>>>")
    }
    onDestroy(){
        return;
        this.node.getChildByName("CardBg").off(NodeEventType.TOUCH_START,this.onTouchStart,this);
        this.node.getChildByName("CardBg").off(NodeEventType.TOUCH_MOVE,this.onTouchMove,this);
        this.node.getChildByName("CardBg").off(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        this.node.getChildByName("CardBg").off(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
    }
    update(deltaTime: number) {
        // if (this._time > 0) {
        //     this._time -= deltaTime;

        //     this._time = this._time < 0 ? 0 : this._time;
        //     let rate = Math.abs(this._time - this._median) * 2 / this.duration;
        //     this._material.setProperty("u_rate", rate);
        // }
    }
    //====方法事件
    //初始化数据
    initData(posType:number,id:number=0,uid:number=0,index:number=0){
        // console.log(this.node.getSiblingIndex(),index,"卡牌id>>>",id);
        this.posType=posType;
        this.node.getChildByName("Buff").setPosition(0,posType==2?-105:105);
        this.index=index;
        this.uid=uid;
        this.buffList=[];
        if(id==undefined||id==0){
            this.showBack(true);
            return;
        }
        // console.log(this.node.getParent(),">>>1initData");
        // console.log(this.node.getParent().getParent(),">>>2initData");
        
        this.baseData=GameConfig.getCardDataById(id);
        // this.baseData.need=JSON.parse(this.baseData.need);//json解析特招条件
        console.log("initData>>>basedata",this.baseData);
        this.showBase();
        //场上陷阱卡特殊处理 盖放
        if(posType==2&&this.baseData&&this.baseData.cardType==3){
            this.showBack(true);
        }
    }
    //改变卡牌 uid id
    changeData(id:number=0,uid:number=0){
        this.uid=uid;
        this.buffList=[];
        if(id==undefined||id==0){
            this.showBack(true);
            return;
        }
        this.baseData=GameConfig.getCardDataById(id);
        if(this.baseData) this.showBack(false);
        // console.log("initData>>>basedata",this.baseData);
        this.showBase();
    }
    //处理buff等效果显示  召唤成功触发
    updateData(data:any){
        this.uid=data.uid;
        // if(this.pos)
        // this.updateBuffPos();
        // for(let i=0;i<this.buffList.length;i++){
            // let b= instantiate(this.IconBuff);
            // b.name=String(this.buffList[i].uid);
            // b.setScale(0.6,0.6);
            // b.setParent(this.node.getChildByName("Buff"));
            // b.getComponent(Sprite).changeSpriteFrameFromAtlas(String(this.buffList[i].id));
            // let posX=( i* (15+0)*2) - (this.buffList.length-1)*(15+0);
            // b.setPosition(posX,0);
        // }
        if(data.buffList){
            for(let i=0;i<data.buffList.length;i++){
                let buffOne=data.buffList[i];
                this.addBuff(buffOne.uid,buffOne.id,buffOne.value);
            }
        }
        this.initAttackCount();//攻击次数暂时默认1
        this.attackedCount=data.attackedCount;
        console.log("updateData>>",this.buffList.length)
        // posX=( index* (cardHalf+apart)*2) - (cardNum-1)*(cardHalf+apart);
    }
    //初始化重置攻击次数
    initAttackCount(onlyUpdate:boolean=false){
        //判断是否有105双击
        this.attackCount=this.getBuff(GameConfig.BUFF_DOUBLE).length>0?2:1;
        if(!onlyUpdate)     this.attackedCount=0;
        // this.attackCount=value;
    }
    //改变攻击次数
    changeAttackCount(){
        this.attackedCount++;
        // this.attackCount+=value;
        // if(this.attackCount<0) this.attackCount=0;
    }
    //添加buff
    addBuff(uid:number,buffId:number,value:number){
        console.log(this.baseData.cardName,"获得buff",buffId,"uid>",uid,"value>",value);
        // console.log(this.buffList)
        this.buffList.push({uid:uid,id:buffId,value:value});
        let index=this.buffList.length-1;
        let b= instantiate(this.IconBuff);
        
        b.on(NodeEventType.TOUCH_START,this.onBuffTouchStart,this);
        // b.on(NodeEventType.TOUCH_END,this.onBuffTouchEnd,this);
        // b.on(NodeEventType.TOUCH_CANCEL,this.onBuffTouchCancel,this);
        b.name=String(uid);//this.buffList[index].uid
        b.setScale(0.6,0.6);
        b.setParent(this.node.getChildByName("Buff"));
        let spriteFrameStr=String(this.buffList[index].id);
        if(buffId==GameConfig.BUFF_ATTACK){
            if(value<0) spriteFrameStr+="_1";
            this.updateAttack();
        }
        if(buffId==GameConfig.BUFF_DOUBLE) this.attackCount=2;
        b.getComponent(Sprite).changeSpriteFrameFromAtlas(spriteFrameStr);
        // let posX=( index* (15+0)*2) - (this.buffList.length-1)*(15+0);
        // b.setPosition(posX,0);
        this.updateBuffPos();
        this.buffEffect(spriteFrameStr);
    }
    buffEffect(spriteFrameStr:string,tweenType:number=0){

        let initScale=tweenType?3:3;
        // let targetScale=tweenType?4:1;
        let b= instantiate(this.IconBuff);
        b.setScale(initScale,initScale);
        b.setParent(this.node);
        b.getComponent(Sprite).changeSpriteFrameFromAtlas(spriteFrameStr);
        if(tweenType){
            // tween(b).delay(0.2).hide().delay(0.1).show().delay(0.1).hide().delay(0.1).show().
            tween(b).delay(0.4).
            call(() => { 
                b.removeFromParent();
            }).start();
        }else{
            tween(b).to(0.5,{scale:new Vec3(1,1,1)}).
            // delay(0.1).
            call(() => { 
                b.removeFromParent();
            }).start();
        }
        
    }

    updateBuffPos(){
        let buffNode=this.node.getChildByName("Buff");
        for(let i=0;i<buffNode.children.length;i++){
            let buff=buffNode.children[i];
            let posX=( i* (15+0)*2) - (buffNode.children.length-1)*(15+0);
            buff.setPosition(posX,0);
        }
        console.log("updateBuffPos》》》》>>",this.buffList.length)
    }
    //移除Buff
    removeBuff(uid:number){
        console.log("移除buff方法>>>>>>>>>>>>>>>>>>>>",uid);
        let buffId:number;
        for(let i=0;i<this.buffList.length;i++){
            let buffOne=this.buffList[i];
            if(buffOne.uid==uid) {
                buffId=buffOne.id;
                this.buffList.splice(i,1);
                // this.node.getChildByName("Buff").getch
                break;
            }    
        }
        for(const buff of this.node.getChildByName("Buff").children){
            if(buff.name==String(uid)) {
                console.log("找到buff 移除",uid);
                buff.off(NodeEventType.TOUCH_START,this.onBuffTouchStart,this);
                // buff.off(NodeEventType.TOUCH_END,this.onBuffTouchEnd,this);
                // buff.off(NodeEventType.TOUCH_CANCEL,this.onBuffTouchCancel,this);
                buff.removeFromParent();
                this.updateBuffPos();
                break;
            }    
        }  
        if(buffId==GameConfig.BUFF_ATTACK){
            this.updateAttack();
        }  
        this.initAttackCount(true);
    }
    //获取buff
    getBuff(buffId:number){
        let arr=[];
        for(let i=0;i<this.buffList.length;i++){
            let buff=this.buffList[i];
            if(buff.id==buffId)arr.push(buff);
        }
        return arr;
    }
    getBuffByUid(uid:number):any{
        for(let i=0;i<this.buffList.length;i++){
            let buff=this.buffList[i];
            if(buff.uid==uid) return buff;
        }
        return null;
    }

    //初始化gamecontrol
    initParent(parent:Node){
        this.node.setParent(parent);
        this.gameControl=this.node.getParent().getParent().getComponent(GameControl);
    }
    updateAttack(){
        this.node.getChildByName("AttackBg").getChildByName("LbAttack").getComponent(Label).string=this.getAttack();
    }
    //更新索引
    updateIndex(index:number){
        this.index=index;
    }
    //显示卡背
    showBack(bool:boolean){
        this.node.getChildByName("CardBg").active=!bool||this.posType==2;
        this.node.getChildByName("Buff").active=!bool;
        this.node.getChildByName("LbName").active=!bool;
        this.node.getChildByName("ForceBg").active=!bool;
        this.node.getChildByName("Info").active=!bool;
        this.node.getChildByName("CardEdge").active=!bool;
        this.node.getChildByName("AttackBg").active=!bool;
        

        this.node.getChildByName("CardBack").active=bool;
    }
    //显示基础信息
    showBase(){
        
        this.node.getChildByName("LbName").getComponent(Label).color=GameConfig.COLOR_RARE[this.baseData.rare];
        let posX=(this.baseData.cardType==1||this.baseData.force==0)?0:-15;
        this.node.getChildByName("LbName").setPosition(posX,this.node.getChildByName("LbName").position.y)
        this.node.getChildByName("LbName").getComponent(UITransform).width=this.baseData.cardType==1?60:90;
        this.node.getChildByName("LbName").getComponent(Label).string=this.baseData.cardName;
        this.node.getChildByName("Info").getComponent(Label).string=this.baseData.info;
        // this.node.getChildByName("LbAttack").getComponent(Label).string=this.getAttack();
        this.node.getChildByName("CardBg").getComponent(Sprite).changeSpriteFrameFromAtlas("cardBg"+this.baseData.cardType);
        this.node.getChildByName("CardEdge").getComponent(Sprite).changeSpriteFrameFromAtlas("edge"+this.baseData.rare);
        this.node.getChildByName("AttackBg").active=this.baseData.cardType==1;//武将卡显示攻击力
        this.node.getChildByName("ForceBg").active=this.baseData.force>0;
        this.node.getChildByName("ForceBg").getChildByName("LbForce").getComponent(Label).string=GameConfig.FORCE_NAME_ICON[this.baseData.force];
        this.updateAttack();
    }
    //获取实际攻击力
    getAttack(){
        let att=0;
        for(let i=0;i<this.buffList.length;i++){
            let buff=this.buffList[i];
            if(buff.id==GameConfig.BUFF_ATTACK){
                att+=parseInt(buff.value);
            }
        }
        let newAtt=this.baseData.attack+att;
        if(newAtt<0) newAtt=0;
        return newAtt;
        // return this.baseData.attack;
    }
    //========================触摸事件
    //bufficon
    onBuffTouchStart(e:EventTouch){
        let buff=this.getBuffByUid(parseInt(e.target.name))
        console.log(e.target.name,"显示bufftips<<<<onBuffTouchStart",e.getUILocation(),buff)
        if(buff)    Toast.showTip(GameConfig.getBuffString(buff.id,buff.value),e.getUILocation());
        //event.stopPropagation();  
    }    
    onForceTouchStart(e:EventTouch){
        Toast.showTip(GameConfig.FORCE_NAME[this.baseData.force]+"势力",e.getUILocation());
    }
    onBuffTouchEnd(e:EventTouch){
        Toast.hideTip();
    }  
    onBuffTouchCancel(e:EventTouch){
        Toast.hideTip();
    }    
    //卡牌触摸
    onTouchStart(e:EventTouch){
        if(!this.gameControl||this.gameControl.gameState==2) return;
        this.initPos=new Vec3(this.node.position);//.x,this.node.position.y
        this.initIndex=this.node.getSiblingIndex();
        if(this.posType==1){
            console.log(this.index,"start设置sindex",this.node.getParent().children.length-1)
            this.node.setSiblingIndex(this.node.getParent().children.length);//测试
            //GameEvent.Instance.emit("updateCardIndex",{index:this.index,sIndex:this.node.getSiblingIndex()});
            this.node.setPosition(this.node.position.x,this.node.position.y+40);
        }    
        //判断显示我的陷阱卡信息
        if(this.posType==2&&(this.baseData&&this.baseData.cardType>1)) {
            this.gameControl.showRichTextCard(String(this.baseData.id));
        }    
        // console.log(this.node.getSiblingIndex(),"=========touch start",this.node.position);
        // console.log(this.node.getWorldPosition().x,this.node.getWorldPosition().y,"touchstart",e.getLocation(),e.getUILocation());
    }
    onTouchMove(e:EventTouch){
        if(!this.gameControl||this.gameControl.gameState==2) return;
        // if(this.posType==2) console.log("e>>touchmove",e);
        // let location = e.getDelta()
        if(this.posType==1&&this.gameControl.myTurn){//手牌可拖动 出牌
            let newX=this.node.getPosition().x+e.getUIDelta().x;
            let newY=this.node.getPosition().y+e.getUIDelta().y;
            this.node.setPosition(newX,newY);
            // console.log("move后坐标",this.node.position);
        }
        if(this.posType==2&&this.gameControl.myTurn&&this.baseData&&this.baseData.cardType==1) {
            // console.log("e>>touchmove",e);
            let uinode = this.node.getParent().getComponent(UITransform);
            let touchPos=new Vec3(e.getUILocation().x,e.getUILocation().y);
            // console.log(uinode.convertToNodeSpaceAR(touchPos),"<世界转ui坐标",this.node.position.x,this.node.position.y);
            this.gameControl.showAttackArrow(this.node.position,uinode.convertToNodeSpaceAR(touchPos));
        }    
        // let pos2=e.getLocation();
        // let pos = new Vec3(pos2.x+60 , pos2.y+90 , 0);
        // //convertToNodeSpaceAR:将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系
        // this.node.position=this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos);
        // return;
        
    }
    onTouchEnd(e:EventTouch){
        // this._time = this.duration;//测试shader
        this.disappear();

        if(this.gameControl&&this.gameControl.gameState==2) {
            this.gameControl.selectChangeCard(this.uid);
            return;
        }
        // console.log(this.node.position.y,this.initPos.y,">>>end>>",e);
        // console.log(this.node.getParent().getParent().getComponent(GameControl),"<<game");
        if(this.posType==2) {//我的回合我的桌上的武将卡
            this.gameControl.hideArrow();
        }    
       
        //出牌逻辑判断  判断是否手牌和出牌条件
        if(this.node.position.y>180&&this.posType==1&&this.gameControl.judgeCardUse(this)){
            console.log("召唤发送消息");
            return;
        }
        // console.log("<<<<<onTouchEnd")
         //重置位置
         this.node.setPosition(this.initPos);
         this.node.setSiblingIndex(this.initIndex);
         if(this.posType==1&&this.node.position.y!=0){
            console.log("手牌坐标有问题 需要重新update???")
         }
    }
    onTouchCancel(e:EventTouch){
        if(!this.gameControl||this.gameControl.gameState==2) return;
        // console.log(">>>cancel>>",e);
        if(this.posType==2) {//我的回合我的桌上的武将卡
            if(this.node.getParent()){
                let uinode = this.node.getParent().getComponent(UITransform);
                let touchPos=new Vec3(e.getUILocation().x,e.getUILocation().y);
                this.gameControl.hideArrow();
                if(this.gameControl.myTurn&&this.baseData&&this.baseData.cardType==1){//武将卡判断攻击
                    this.gameControl.judgeAttack(this,uinode.convertToNodeSpaceAR(touchPos));
                } 
            } 
        }  
        if(this.posType==1){
            if(this.node){
                this.node.setPosition(this.initPos);
                this.node.setSiblingIndex(this.initIndex);
            }
        }
    }
    //卡牌破坏
    disappear(){
        return;
        this._time = this.duration;//测试shader
    }
}


