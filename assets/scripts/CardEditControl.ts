import { _decorator, Color, Component, director, EditBox, EventTouch, instantiate, Label, Layout, Node, NodeEventType, Prefab, ScrollView, Sprite, UIOpacity, UITransform, Vec3, view } from 'cc';
import GameConfig from './Base/GameConfig';
import Toast from './Base/Toast';
import { AlertControl } from './Common/AlertControl';
import { CardControl } from './CardControl';
import GameEvent from './Base/GameEvent';
import { ForceItemControl } from './Game/ForceItemControl';
import { CardItemControl } from './Game/CardItemControl';
import { SocketIO } from './Base/SocketIO';
import { CardEditItemControl } from './Game/CardEditItemControl';
import { AudioManager } from './Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('CardEditControl')
export class CardEditControl extends Component {
    // @property(Prefab)
    // Alert:Prefab;

    @property(Prefab)
    Card:Prefab;

    @property(Prefab)
    CardItem:Prefab;

    @property(Prefab)
    CardEditItem:Prefab;

    @property(Prefab)
    ForceItem:Prefab;

    BtCreateConfirm:Node;
    BtCreateCancel:Node;
    
    initMovePos:Vec3;

    scrollDeckList:Node;//我的所有卡组scrollview
    scrollList:Node;//单个卡组scrollview

    selectCard:Node;//选择的卡组 可以编辑 删除 
    initCardList:Array<any>;//初始卡组 用于判断是新建还是修改卡组

    showDetail:boolean;//显示详细单个卡组 true
    socketIO=null;
    cardNameEditBox: EditBox;
    changeNameEditBox: EditBox;
    selectForce:number;//当前选择的编辑卡组势力
    createCardName:string;
    cardNum:number;
    currentPage:number;//当前页 0开始
    allPage:number;//总页数
    currentForce:number;//左侧列表当前显示的势力
    allForce:number;//总势力数
    // currentCardList
    cardDataList:any;
    onLoad(){
        console.log("onload  卡组编辑");
        this.socketIO=SocketIO.Instance;
        //游戏事件
        //右侧列表
        GameEvent.Instance.on("cardItemTouch",this.cardItemTouch,this);
        GameEvent.Instance.on("cardItemEditTouchMove",this.cardEditTouchMove,this);
        GameEvent.Instance.on("cardItemEditTouchEnd",this.cardEditTouchEnd,this);
        GameEvent.Instance.on("cardItemEditTouchCancel",this.cardItemEditTouchCancel,this);

        //左侧列表
        GameEvent.Instance.on("forceItemSelect",this.forceItemSelect,this);
        GameEvent.Instance.on("cardEditTouchStart",this.cardEditTouchStart,this);
        GameEvent.Instance.on("cardEditTouchMove",this.cardEditTouchMove,this);
        GameEvent.Instance.on("cardEditTouchEnd",this.cardEditTouchEnd,this);
        GameEvent.Instance.on("cardEditTouchCancel",this.cardEditTouchCancel,this);

        //点击卡组
        GameEvent.Instance.on("cardEditItemSelect",this.cardEditItemSelect,this);
        //卡组设为匹配
        GameEvent.Instance.on("cardEditItemUse",this.cardEditItemUse,this);

        //消息
        GameEvent.Instance.on("cardEdit_create",this.reqCardEditCreate,this);
        GameEvent.Instance.on("cardEdit_delete",this.reqCardEditDelete,this);
        GameEvent.Instance.on("cardEdit_update",this.reqCardEditUpdate,this);
        GameEvent.Instance.on("cardEdit_use",this.reqCardEditUse,this);
        GameEvent.Instance.on("cardEdit_getList",this.reqCardEditGetList,this);
        GameEvent.Instance.on("cardEdit_getInfo",this.reqCardEditGetInfo,this);
        
        //触摸
        // this.node.on(NodeEventType.TOUCH_END,this.onTouchEnd,this);
        // this.node.on(NodeEventType.TOUCH_CANCEL,this.onTouchCancel,this);
        
        this.scrollList=this.node.getChildByName("CardList");
        this.scrollDeckList=this.node.getChildByName("DeckList");

        this.BtCreateConfirm=this.node.getChildByName("UICreateCard").getChildByName("BtCreateConfirm");
        this.BtCreateCancel=this.node.getChildByName("UICreateCard").getChildByName("BtCreateCancel");
        // this.loadData();
        this.node.getChildByName("UICreateCard").getChildByName("BgRect").getComponent(UITransform).height=Math.ceil((GameConfig.FORCE_NAME.length-1)/8)*80*2+240;
        this.cardNameEditBox = this.node.getChildByName("UICreateCard").getChildByName("EbCardName").getComponent(EditBox);
        this.node.getChildByName("UICreateCard").getChildByName("EbCardName").setPosition(0,Math.ceil((GameConfig.FORCE_NAME.length-1)/8)*80+30);
        this.changeNameEditBox = this.node.getChildByName("UIChangeName").getChildByName("EbChangeName").getComponent(EditBox);
        this.BtCreateConfirm.setPosition(this.BtCreateConfirm.position.x,-Math.ceil((GameConfig.FORCE_NAME.length-1)/8)*80-50);
        this.BtCreateCancel.setPosition(this.BtCreateCancel.position.x,-Math.ceil((GameConfig.FORCE_NAME.length-1)/8)*80-50);
        this.node.getChildByName("CardList").getComponent(UITransform).height=view.getVisibleSize().height-360;
        this.node.getChildByName("DeckList").getComponent(UITransform).height=view.getVisibleSize().height-360;
        
        this.initCardData();
        this.node.getChildByName("NodeList").removeAllChildren();
        let rowNum=Math.floor((view.getVisibleSize().height-170)/190);
        this.node.getChildByName("NodeList").getComponent(UITransform).height=180*rowNum+(rowNum-1)*10;
        this.node.getChildByName("BgNodeList").getComponent(UITransform).height=190*rowNum;
        this.cardNum=4*rowNum;
        this.showBtState(false);

        this.allForce=GameConfig.FORCE_NAME.length;
        this.currentPage=0;

        this.initCardList=[];
        //左侧卡组图鉴
        this.showNodeList(0);
        //请求卡组列表
        this.socketIO.socket.emit("CARD", {
            type: "cardEdit_getList",
            user: this.socketIO.userID
        });
        return;
        console.log("scrollview",this.node.getChildByName("testList"))
        let nodeUI=this.node.getChildByName("testList").getComponent(ScrollView).content;
        for(let i=0;i<5;i++){
            let c= instantiate(this.CardItem);
            c.setPosition(0,i*50);
            c.getComponent(CardItemControl).initData(this.cardDataList[0][i],3);
            c.setParent(nodeUI);
        }
    }    

    protected onDestroy(): void {
        GameEvent.Instance.off("cardItemTouch",this.cardItemTouch,this);
        GameEvent.Instance.off("cardItemEditTouchMove",this.cardEditTouchMove,this);
        GameEvent.Instance.off("cardItemEditTouchEnd",this.cardEditTouchEnd,this);
        GameEvent.Instance.off("cardItemEditTouchCancel",this.cardItemEditTouchCancel,this);

        GameEvent.Instance.off("forceItemSelect",this.forceItemSelect,this);
        GameEvent.Instance.off("cardEditTouchStart",this.cardEditTouchStart,this);
        GameEvent.Instance.off("cardEditTouchMove",this.cardEditTouchMove,this);
        GameEvent.Instance.off("cardEditTouchEnd",this.cardEditTouchEnd,this);
        GameEvent.Instance.off("cardEditTouchCancel",this.cardEditTouchCancel,this);

        GameEvent.Instance.off("cardEditItemSelect",this.cardEditItemSelect,this);

        GameEvent.Instance.off("cardEditItemUse",this.cardEditItemUse,this);

        GameEvent.Instance.off("cardEdit_create",this.reqCardEditCreate,this);
        GameEvent.Instance.off("cardEdit_delete",this.reqCardEditDelete,this);
        GameEvent.Instance.off("cardEdit_update",this.reqCardEditUpdate,this);
        GameEvent.Instance.off("cardEdit_use",this.reqCardEditUse,this);
        GameEvent.Instance.off("cardEdit_getList",this.reqCardEditGetList,this);
        GameEvent.Instance.off("cardEdit_getInfo",this.reqCardEditGetInfo,this);
    }
    start() {
        console.log("cardEitcontrol =======start",this.showDetail,this.socketIO);
    }

    update(deltaTime: number) {
        
    }
    //方法
    initCardData(){
        this.cardDataList=[];
        console.log(GameConfig.CARD_DATA.length);
        for (const key in GameConfig.CARD_DATA) {  
            // if (CARD_DATA.hasOwnProperty(key)) {  
            const card = GameConfig.CARD_DATA[key];  
            if(!this.cardDataList[card.force]) this.cardDataList[card.force]=[];
            this.cardDataList[card.force].push(card.id);
            // console.log(card,card);
            // console.log(card.force,"card force",this.cardDataList[card.force])
        }    
        console.log(this.cardDataList.length,this.cardDataList)
    }
    //显示我的卡组列表
    showDeckList(data:any){
        console.log(this.scrollDeckList,"显示我的卡组列表",data);
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        parentNode.removeAllChildren();
        for(let i=0;i<data.length;i++){
            this.addToDeckList(data[i]);
        }
    }
    addToDeckList(data:any){
        // let parentNode=this.scrollList.getChildByName("view").getChildByName("content");
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        
        let c= instantiate(this.CardEditItem);
        c.getComponent(CardEditItemControl).initData(data.id,data.cardName,data.force,data.used);
        c.setParent(parentNode);
        // console.log("content height>>",parentNode.getComponent(UITransform).height);
    }
    removeFromDeckList(id:number){
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        for(const card of parentNode.children){
            let cardControl=card.getComponent(CardEditItemControl);
            if(cardControl.id==id){
                if(cardControl.id==this.selectCard.getComponent(CardEditItemControl).id) this.selectCard=null;//删除启用中的卡组 清除选中的卡组
                card.removeFromParent();
                // return card;
            }
        }  
        // let card=this.getCardItem(id);
        // if(card) {
        //     card.removeFromParent();
        // }    
    }
    //显示单个卡组
    showCardList(data:any){
        console.log("显示单个卡组");
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        parentNode.removeAllChildren();
        for(let i=0;i<data.length;i++){
            this.addToList(data[i]);
        }
        this.initCardList=data;//初始卡组 用于判断是新建还是修改卡组
    }
    addToList(id:number){
        // let parentNode=this.scrollList.getChildByName("view").getChildByName("content");
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        let card=this.getCardItem(id);
        if(card) {
            let cControl=card.getComponent(CardItemControl);
            if(cControl.count==2){
                Toast.toast("同名卡最多只能放2张");
            }else if(cControl.baseData.rare==4&&cControl.count==1){
                Toast.toast("同名传说卡最多只能放1张");
            }
            else cControl.changeCount(1);
        }    
        else{
            let c= instantiate(this.CardItem);
            c.getComponent(CardItemControl).initData(id,1);
            c.setParent(parentNode);
        }
        console.log("content height>>",parentNode.getComponent(UITransform).height);
    }
    removeFromList(id:number){
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        let card=this.getCardItem(id);
        if(card) {
            let cControl=card.getComponent(CardItemControl);
            if(cControl.count==2){
                cControl.changeCount(-1);
            }
            else{
                card.removeFromParent();
            }
        }    
    }
    //显示 0/30 
    showListCount(){
        // let parentNode=this.scrollList.getComponent(ScrollView).content;
        // let num=0;
        // for(const cardItem of parentNode.children){
        //     let cardControl=cardItem.getComponent(CardItemControl);
        //     num+=cardControl.count;
        // }
        this.node.getChildByName("Bottom").getChildByName("LbRightListCount").getComponent(Label).string=this.getCurrentCardCount()+"/"+GameConfig.CARD_COUNT_LIMIT;
    }
    getCurrentCardCount():number{
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        let num=0;
        for(const cardItem of parentNode.children){
            let cardControl=cardItem.getComponent(CardItemControl);
            num+=cardControl.count;
        }
        return num;
    }
    getCurrentCardList():Array<number>{
        let arr=[];
        let parentNode=this.scrollList.getComponent(ScrollView).content;
        for(const cardItem of parentNode.children){
            let cardControl=cardItem.getComponent(CardItemControl);
            arr.push(cardControl.baseData.id);
            if(cardControl.count==2) arr.push(cardControl.baseData.id);
        }
        return arr;
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
    //左侧卡组列表
    showNodeList(force:number){
        this.currentForce=force;
        console.log(force,"显示左侧卡组列表",this.cardDataList[force].length);
        this.allPage=1+Math.floor(this.cardDataList[force].length/this.cardNum);
        this.node.getChildByName("Bottom").getChildByName("LbPage").getComponent(Label).string=(this.currentPage+1)+"/"+this.allPage;
        this.node.getChildByName("NodeList").removeAllChildren();
        let max=Math.min(this.cardDataList[force].length,(this.currentPage+1)*this.cardNum);
        // console.log(max,"<<max",this.cardNum)
        for(let i=this.currentPage*this.cardNum;i<max;i++){
            let c= instantiate(this.Card);
            // c.name="leftShowCard";
            c.getComponent(CardControl).initData(0,this.cardDataList[force][i],0,i-this.currentPage*this.cardNum);
            c.setParent(this.node.getChildByName("NodeList"));//.getChildByName("UIInfo")
            // console.log(this.cardDataList[force][i],"<<this.cardDataList[force][i]")
            // this.node.getChildByName("NodeList").addChild(c);
            // c.getComponent(CardControl).initParent(this.node.getChildByName("NodeList"));
        }
        // console.log("数量",this.node.getChildByName("NodeList").children.length)
        this.judgePageBt();
    }
    //按钮显示状态  true显示单个卡组详细卡牌列表
    showBtState(showEditCard:boolean=true){
        this.showDetail=showEditCard;
        this.node.getChildByName("Top").getChildByName("BtCreateCard").active=!showEditCard;
        this.node.getChildByName("Top").getChildByName("BtChangeName").active=!showEditCard;
        this.node.getChildByName("Bottom").getChildByName("BtEditCard").active=!showEditCard;
        this.node.getChildByName("Bottom").getChildByName("BtDeleteCard").active=!showEditCard;

        this.node.getChildByName("Top").getChildByName("BtMyCard").active=showEditCard;
        this.node.getChildByName("Bottom").getChildByName("BtSaveCard").active=showEditCard;
        this.node.getChildByName("Bottom").getChildByName("LbRightListCount").active=showEditCard;

        this.node.getChildByName("DeckList").active=!showEditCard;
        this.node.getChildByName("CardList").active=showEditCard;
    }
    //判断翻页按钮状态
    judgePageBt(){
        // if(this.currentPage==0) 
        this.node.getChildByName("Bottom").getChildByName("BtPrevious").active=this.currentPage>0;
        this.node.getChildByName("Bottom").getChildByName("BtNext").active=this.currentPage<this.allPage-1;
        this.node.getChildByName("Bottom").getChildByName("BtPreviousForce").active=!this.node.getChildByName("Bottom").getChildByName("BtPrevious").active;
        this.node.getChildByName("Bottom").getChildByName("BtNextForce").active=!this.node.getChildByName("Bottom").getChildByName("BtNext").active;
        
        if(this.node.getChildByName("Bottom").getChildByName("BtPreviousForce").active){
            let pForce:number;
            if(this.showDetail){
                pForce=this.currentForce?0:this.selectForce;
            }else{
                pForce=this.currentForce-1;
                if(pForce==-1) pForce=GameConfig.FORCE_NAME.length-1;
            }
            this.node.getChildByName("Bottom").getChildByName("BtPreviousForce").getChildByName("Label").getComponent(Label).string=GameConfig.FORCE_NAME[pForce];
        }
        if(this.node.getChildByName("Bottom").getChildByName("BtNextForce").active){
            let nextForce:number;
            if(this.showDetail){
                nextForce=this.currentForce?0:this.selectForce;
            }else{
                nextForce=this.currentForce+1;
                if(nextForce==GameConfig.FORCE_NAME.length) nextForce=0;
            }
            this.node.getChildByName("Bottom").getChildByName("BtNextForce").getChildByName("Label").getComponent(Label).string=GameConfig.FORCE_NAME[nextForce];
        }
        
    }
    //绑定的按钮事件
    onBtPrevious(e:Event){
        AudioManager.inst.playOneShot("audio/bt_middle");
        this.currentPage--;
        this.showNodeList(0);
        // this.judgePageBt();
    }
    onBtNext(e:Event){
        // console.log(e.currentTarget)
        AudioManager.inst.playOneShot("audio/bt_middle");
        this.currentPage++;
        this.showNodeList(0);
        // this.judgePageBt();
    }
    onBtPreviousForce(e:Event){
        AudioManager.inst.playOneShot("audio/bt_middle");
        this.currentPage=0;
        if(this.showDetail){
            this.currentForce=this.currentForce?0:this.selectForce;
        }else{
            this.currentForce--;
            if(this.currentForce==-1) this.currentForce=GameConfig.FORCE_NAME.length-1;
        }
        this.showNodeList(this.currentForce);
    }
    onBtNextForce(e:Event){
        AudioManager.inst.playOneShot("audio/bt_middle");
        this.currentPage=0;
        if(this.showDetail){
            this.currentForce=this.currentForce?0:this.selectForce;
        }else{
            this.currentForce++;
            if(this.currentForce==GameConfig.FORCE_NAME.length) this.currentForce=0;
        }
        this.showNodeList(this.currentForce);
    }
    onBtReturnHall(){
        AudioManager.inst.playOneShot("audio/bt_back");
        //两种情况 新建完卡组满30没保存 编辑完卡组不满30没保存
        if( (this.getCurrentCardCount()<GameConfig.CARD_COUNT_LIMIT&&this.showDetail) || (this.getCurrentCardCount()==GameConfig.CARD_COUNT_LIMIT&&this.initCardList.length==0)){
            // console.log("卡牌未编辑完成 不会保存");
            Toast.alert("卡组未编辑完成 不会保存当前卡组 确定返回大厅吗？",true,()=>{
                director.loadScene("hall");
            });
            // let al= instantiate(this.Alert);
            // let aControl=al.getComponent(AlertControl);
            // aControl.show("卡组未编辑完成 不会保存当前卡组 确定返回大厅吗？",true,()=>{
            //     director.loadScene("hall");
            // });
            // al.setParent(this.node);
            return;
        }
        director.loadScene("hall");
    }
    onBtMyCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        let cardList=this.node.getChildByName("CardList");
        if(this.getCurrentCardCount()<GameConfig.CARD_COUNT_LIMIT){
            // console.log("卡牌未编辑完成 不会保存");
            Toast.alert("卡组未编辑完成 不会保存当前卡组 确定返回我的卡组列表吗？",true,()=>{
                this.showBtState(false);
                this.currentPage=0;
                this.showNodeList(0);
            });
            // let al= instantiate(this.Alert);
            // let aControl=al.getComponent(AlertControl);
            // aControl.show("卡组未编辑完成 不会保存当前卡组 确定返回我的卡组列表吗？",true,()=>{
            //     this.showBtState(false);
            //     this.currentPage=0;
            //     this.showNodeList(0);
            // });
            // al.setParent(this.node);
            return;
        }
        this.showBtState(false);
        this.currentPage=0;
        this.showNodeList(0);
    }
    //新建卡组
    onBtCreateCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        if(this.scrollDeckList.getComponent(ScrollView).content.children.length>=5){
            Toast.toast("您的卡组数量已达上限！")
            return;
        }
        this.selectForce=0;
        this.createCardName="";
        let node=this.node.getChildByName("UICreateCard").getChildByName("NodeForce");
        node.removeAllChildren();
        this.node.getChildByName("UICreateCard").active=true;
        for(let i=1;i<GameConfig.FORCE_NAME.length;i++){
            let c= instantiate(this.ForceItem);
            c.getComponent(ForceItemControl).init(i);
            // c.name="leftShowCard";
            // c.setPosition(100,300);
            c.setParent(node);
        }
    }
    //确定新建
    onBtCreateConfirm(){
        AudioManager.inst.playOneShot("audio/bt_back");
        if(!this.cardNameEditBox.string){
            Toast.toast("请输入卡组名字");
            return;
        }
        if(!this.selectForce){
            Toast.toast("请选择一个势力");
            return;
        }
        console.log("创建卡组 开始编辑");
        this.createCardName=this.cardNameEditBox.string;
        this.node.getChildByName("UICreateCard").active=false;

        
        this.showBtState();
        this.showCardList([]);
        this.showListCount();
        this.showNodeList(0);
    }
    //取消新建
    onBtCreateCancel(){
        AudioManager.inst.playOneShot("audio/bt_back");
        // this.node.getChildByName("UI")
        this.node.getChildByName("UICreateCard").active=false;
    }
    //卡组改名
    onBtChangeName(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        if(this.scrollDeckList.getComponent(ScrollView).content.children.length==0){
            Toast.toast("您还没有卡组!先新建一个卡组吧！");
            return;
        }
        if(!this.selectCard){
            Toast.toast("请选择一个卡组!");
            return;
        }
        this.node.getChildByName("UIChangeName").active=true;
    }
    //确定改名
    onBtChangeNameConfirm(){
        AudioManager.inst.playOneShot("audio/bt_back");
        if(!this.changeNameEditBox.string){
            Toast.toast("请输入卡组名字");
            return;
        }
        // console.log("创建卡组 开始编辑");
        // this.createCardName=this.cardNameEditBox.string;
        this.socketIO.socket.emit("CARD", {
            type: "cardEdit_update",
            id:this.selectCard.getComponent(CardEditItemControl).id,
            cardName:this.changeNameEditBox.string,
            user: this.socketIO.userID
        });
        this.node.getChildByName("UIChangeName").active=false;
    }
    //取消改名
    onBtChangeNameCancel(){
        AudioManager.inst.playOneShot("audio/bt_back");
        // this.node.getChildByName("UI")
        this.node.getChildByName("UIChangeName").active=false;
    }
    //编辑卡组
    onBtEditCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        if(this.scrollDeckList.getComponent(ScrollView).content.children.length==0){
            Toast.toast("您还没有卡组!先新建一个卡组吧！");
            return;
        }
        if(!this.selectCard){
            Toast.toast("请选择一个卡组!");
            return;
        }
        this.socketIO.socket.emit("CARD", {
            type: "cardEdit_getInfo",
            id:this.selectCard.getComponent(CardEditItemControl).id,
            user: this.socketIO.userID
        });
    }
    //删除卡组
    onBtDeleteCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        if(this.scrollDeckList.getComponent(ScrollView).content.children.length==0){
            Toast.toast("您还没有卡组!先新建一个卡组吧！");
            return;
        }
        if(!this.selectCard){
            Toast.toast("请选择一个卡组!");
            return;
        }
        this.socketIO.socket.emit("CARD", {
            type: "cardEdit_delete",
            id:this.selectCard.getComponent(CardEditItemControl).id,
            user: this.socketIO.userID
        });
    }
    //保存卡组
    onBtSaveCard(){
        AudioManager.inst.playOneShot("audio/bt_middle");
        if(this.getCurrentCardCount()<GameConfig.CARD_COUNT_LIMIT){
            Toast.toast("卡牌数量不足，无法保存！");
            return;
        }
        //判断新建还是更新
        if(this.initCardList.length==0){
            this.socketIO.socket.emit("CARD", {
                type: "cardEdit_create",
                cardName:this.createCardName,
                force:this.selectForce,
                card:this.getCurrentCardList(),
                user: this.socketIO.userID
            });
        }else{
            let equal=this.initCardList.every((value, index) => value === this.getCurrentCardList()[index]);  
            // for (let i = 0; i < arr1.length; i++) {  
            //     if (arr1[i] !== arr2[i]) {  
            //         return false;  
            //     }  
            // }
            if(equal){
                Toast.toast("卡组没有变化");
            }else{
                console.log("发送卡组修改");
                this.socketIO.socket.emit("CARD", {
                    type: "cardEdit_update",
                    id:this.selectCard.getComponent(CardEditItemControl).id,
                    force:this.selectForce,
                    card:this.getCurrentCardList(),
                    user: this.socketIO.userID
                });
            }
        }
    }
    //=======================游戏事件
    //右侧列表 点击拖动卡牌
    cardItemTouch(data:any){
        console.log("点击carditem",data);
        let id=parseInt(data.id);
        // return;
        let nodeUI=this.node.getChildByName("UIInfo");
        let leftNode=nodeUI.getChildByName("leftShowCard");
        if(leftNode){
            leftNode.getComponent(CardControl).changeData(id,0);
            leftNode.active=true;
        }else{
            let c= instantiate(this.Card);
            c.name="leftShowCard";
            c.setPosition(270,view.getVisibleSize().height/2-90);
            c.setParent(this.node.getChildByName("UIInfo"));
            c.getComponent(CardControl).initData(0,id,0,nodeUI.children.length);
        }

        //拖动item
        let node=this.node.getChildByName("UIMove");
        node.removeAllChildren();
        let c= instantiate(this.CardItem);
        c.name="moveCard";
        c.setPosition(data.pos.x-360,data.pos.y-view.getVisibleSize().height/2);
        c.getComponent(CardItemControl).initData(id,data.count,false);
        c.setParent(node);
        this.initMovePos=new Vec3(c.position.x,c.position.y);
        console.log("this.initMovePos",this.initMovePos);
    }
    // cardItemEditTouchMove(data:any){
    //     let node=this.node.getChildByName("UIMove");
    //     let moveCard=node.getChildByName("moveCard");
    //     if(moveCard){
    //         moveCard.setPosition(moveCard.position.x+data.posX,moveCard.position.y+data.posY)
    //     }
        
    // }
    // cardItemEditTouchEnd(data:any){
    //     // console.log()
    //     let node=this.node.getChildByName("UIMove");
    //     node.removeAllChildren();
    //     this.node.getChildByName("UIInfo").removeAllChildren();
    // }
    cardItemEditTouchCancel(data:any){
        //有个奇怪的BUG 轻微move没松开手指也会触发一次touchcancel 通过判断移动范围是否超过本身矩形范围来判断是否有效的touchcancel 
        console.log(this.initMovePos,"cardItemEditTouchCancel>>.",data);
        // return;
        let node=this.node.getChildByName("UIMove");
        let moveCard=node.getChildByName("moveCard");
        console.log("cardItemEditTouchcancel>>currentpos",moveCard.position);
        // if(moveCard&&Math.abs(moveCard.position.x-this.initMovePos.x)<moveCard.getComponent(UITransform).width/2&&Math.abs(moveCard.position.y-this.initMovePos.y)<moveCard.getComponent(UITransform).height/2){
        //     console.log("意外触发touch cancel")
        //     return;
        // }
        this.node.getChildByName("UIInfo").removeAllChildren();
        if(moveCard&&this.scrollList.active){
            if(moveCard.position.x<180){
                console.log("移出卡组",data.id);
                this.removeFromList(data.id);
                this.showListCount();
            }
        }
        if(moveCard)    console.log("movecard position",moveCard.position);
        node.removeAllChildren();
    }
    //点击选择势力
    forceItemSelect(data:any){
        AudioManager.inst.playOneShot("audio/bt_small");
        this.selectForce=data.force;
        // console.log("选择势力",this.node.getChildByName("UICreateCard"))
        let node=this.node.getChildByName("UICreateCard").getChildByName("NodeForce");
        for(const force of node.children){
            let forceItemControl=force.getComponent(ForceItemControl);
            force.getChildByName("LbName").getComponent(Label).color=forceItemControl.force==data.force?Color.GREEN:Color.BLACK
            // if(forceItemControl.force==data.force) 
        }    
    }
    cardEditTouchStart(data:any){
        let node=this.node.getChildByName("UIMove");
        node.removeAllChildren();
        if(!this.showDetail) return;
        let c= instantiate(this.Card);
        c.name="moveCard";
        c.setPosition(data.pos.x+this.node.getChildByName("NodeList").position.x,data.pos.y);
        c.getComponent(CardControl).initData(0,data.id,0,node.children.length);
        c.setParent(node);
    }
    cardEditTouchMove(data:any){
        let node=this.node.getChildByName("UIMove");
        let moveCard=node.getChildByName("moveCard");
        if(moveCard){
            moveCard.setPosition(moveCard.position.x+data.posX,moveCard.position.y+data.posY)
            //判断移动范围过小是否隐藏 
            // if(data.judgeRect){
            //     if(Math.abs(moveCard.position.x-this.initMovePos.x)<moveCard.getComponent(UITransform).width/2&&Math.abs(moveCard.position.y-this.initMovePos.y)<moveCard.getComponent(UITransform).height/2){
            //         moveCard.getComponent(UIOpacity).opacity=0;
            //     }else moveCard.getComponent(UIOpacity).opacity=255;
            // }
        }
    }
    cardEditTouchEnd(data:any){
        // console.log()
        let node=this.node.getChildByName("UIMove");
        node.removeAllChildren();
        this.node.getChildByName("UIInfo").removeAllChildren();
    }
    cardEditTouchCancel(data:any){
        this.node.getChildByName("UIInfo").removeAllChildren();
        console.log("cardEditTouchCancel>>>",data);
        let node=this.node.getChildByName("UIMove");
        let moveCard=node.getChildByName("moveCard");
        if(moveCard&&this.scrollList.active){
            if(moveCard.position.x>180){
                console.log("加入卡组",data.id);
                if(this.getCurrentCardCount()==GameConfig.CARD_COUNT_LIMIT){
                    Toast.toast("卡牌数量已达上限！")
                }else{
                    this.addToList(data.id);
                    this.showListCount();
                }
            }
            console.log("movecard position",moveCard.position);
        }
        node.removeAllChildren();
    }
    //触摸
    cardEditItemSelect(data:any){
        console.log("点击选中卡组事件");
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        for(const card of parentNode.children){
            let cardControl=card.getComponent(CardEditItemControl);
            if(cardControl.id==data.id){
                this.selectCard=card;
                card.getChildByName("Bg").getComponent(Sprite).color=Color.YELLOW;
            }else{
                card.getChildByName("Bg").getComponent(Sprite).color=new Color(206,206,206);
            }
        }  
    }
    //启用 设为匹配卡组
    cardEditItemUse(data:any){
        console.log("点击设为匹配卡组",data,this.socketIO);
        AudioManager.inst.playOneShot("audio/bt_small");
        this.socketIO.socket.emit("CARD", {
            type: "cardEdit_use",
            id:data.id,
            user: this.socketIO.userID
        });
    }    
    //服务器消息事件处理
    reqCardEditCreate(data:any){
        console.log("服务器消息 卡组新建成功",data);
        Toast.toast("卡组创建成功！");
        // this.showBtState(false);
        // this.currentPage=0;
        // this.showNodeList(0);

        this.addToDeckList(data);
        //默认选中新建的卡组
        // this.cardEditItemSelect(data.id);
        this.initCardList=this.getCurrentCardList();
        //默认选中并启用新建卡组
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        for(const card of parentNode.children){
            let cardControl=card.getComponent(CardEditItemControl);
            if(cardControl.id==data.id){
                this.selectCard=card;
                cardControl.setUse(1);
                card.getChildByName("Bg").getComponent(Sprite).color=Color.YELLOW;
            }else{
                cardControl.setUse(0);
                card.getChildByName("Bg").getComponent(Sprite).color=new Color(206,206,206);
            }
        }
    }
    reqCardEditDelete(data:any){
        this.removeFromDeckList(data.id);
        console.log("服务器消息 卡组删除成功",data);
    }
    reqCardEditUpdate(data:any){
        console.log("服务器消息 卡组修改成功",data);
        if(data.cardName){
            let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
            for(const card of parentNode.children){
                let cardControl=card.getComponent(CardEditItemControl);
                if(cardControl.id==data.id){
                    cardControl.setCardName(data.cardName);
                    Toast.toast("卡组名称修改成功！");
                }
            } 
        }
        if(data.cardList){
            Toast.toast("卡组保存成功！");
            this.initCardList=this.getCurrentCardList();
        }
    }
    reqCardEditUse(data:any){
        console.log("服务器消息 卡组启用成功",data);
        let parentNode=this.scrollDeckList.getComponent(ScrollView).content;
        for(const card of parentNode.children){
            let cardControl=card.getComponent(CardEditItemControl);
            if(cardControl.id==data.id){
                cardControl.setUse(1);
            }else cardControl.setUse(0);
        } 
    }
    reqCardEditGetList(data:any){
        console.log("服务器消息 卡组列表",data);
        this.showDeckList(data.cardList);
    }
    reqCardEditGetInfo(data:any){
        console.log("服务器消息 卡组详情",data);
        this.selectForce=this.selectCard.getComponent(CardEditItemControl).force;

        this.showBtState();
        this.showCardList(data.cardList);
        this.showListCount();
        this.showNodeList(0);
        
    }
}


