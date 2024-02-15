import { _decorator, Component, Node, director, resources, SpriteFrame, Sprite, tween, Tween, Label } from 'cc';
import { AudioManager } from './Base/AudioManager';
import GameConfig from './Base/GameConfig';
import GameEvent from './Base/GameEvent';
import { SocketIO } from './Base/SocketIO';
import Toast from './Base/Toast';
const { ccclass, property } = _decorator;

@ccclass('DungeonControl')
export class DungeonControl extends Component {

    socketIO=null;
    dungeon:number;
    step:number;
    dungeonData:Array<any>;

    onLoad(){

        this.socketIO=SocketIO.Instance;

        // GameEvent.Instance.on("dungeon_info",this.reqDungeonInfo,this);
        GameEvent.Instance.on("match_error",this.reqMatchError,this);
        GameEvent.Instance.on("match_success",this.reqMatchSuccess,this);
        this.dungeonData=[{step:[10108,10109,10110],title:"剧情一 黄巾之乱",info:"东汉末年，朝廷腐败，政局动荡，黄巾之乱，张角兄弟振臂一呼，以黄巾为帜，聚众起义，愤世之不公，揭竿而起。乱世之中，英雄辈出，或智勇双全，或骁勇善战，共赴国难，誓破暴政。黄巾之乱，实乃社会矛盾之集大成者，亦是英雄豪杰之舞台。风云际会，历史见证，此乱之始，实乃乱世之序曲也。"},
        {step:[10206,10207,10208],title:"剧情二 汉末忠良",info:"东汉末季，朝纲败坏，奸臣当道，乱世之中，亦有忠良之士，心怀天下，忧国忧民。彼等或为智勇之将，或为骁勇之士，皆以破暴安民为己任，共赴国难。彼等或谋划策，或挥戈上阵，誓斩奸邪，以靖天下。黄巾之乱，虽为暴政之末，亦乃忠良之试炼。风云际会，英雄辈出，共谋破贼之策。终使黄巾贼众败退，朝廷得以安定。"},
    ]

        //请求剧情副本信息
        // this.socketIO.socket.emit("DUNGEON", {
        //     type: "dungeon_info",
        //     user: this.socketIO.userID
        // });
    }
    onDestroy(){
        // GameEvent.Instance.off("dungeon_info",this.reqDungeonInfo,this);
        GameEvent.Instance.off("match_error",this.reqMatchError,this);
        GameEvent.Instance.off("match_success",this.reqMatchSuccess,this);
        Tween.stopAll();

    }    
    start() {
        this.reqDungeonInfo(GameConfig.USER_DATA);//测试代码
        
    }

    update(deltaTime: number) {
        
    }
    //==================方法
    getNextLevel():number{
        this.step++;
        if(this.step==4){
            this.dungeon++;
            this.step=1;
        }
        return this.dungeon*10+this.step;
    }
    isLast(){
        return GameConfig.USER_DATA.level==23;
    }
    judgeBt(){
        console.log("GameConfig.USER_DATA.level>>",GameConfig.USER_DATA.level)
        // let end=GameConfig.USER_DATA.level==23;
        this.node.getChildByName("BtChallenge").active=!this.isLast();
        this.node.getChildByName("LbTip").active=this.isLast();
    }
    //=================按钮事件
    onBtChallenge(){
        // GameConfig.USER_DATA.level=this.getNextLevel();
        // this.reqDungeonInfo({level:GameConfig.USER_DATA.level});//测试代码
        // return;

        AudioManager.inst.playOneShot("audio/bt_big");
        if(!this.socketIO||!this.socketIO.socket) {
            console.log('socket不存在')
            return;
        }    
        // if(!this.socketIO.socket.connected){
        //     Toast.toast("服务器连接失败！");
        //     return;
        // }
        this.socketIO.socket.emit("ROOM", {
            type: "match_room",
            gameType:3,
            user: this.socketIO.userID
        });
    }
    onBtReturnHall(){
        // this.reqDungeonInfo({level:12});//测试代码
        // return;

        AudioManager.inst.playOneShot("audio/bt_back");
        director.loadScene("hall");
    }
    //=================服务器消息
    reqDungeonInfo(data:any){
        console.log("收到副本消息");
        Tween.stopAll();
        this.judgeBt();
        // let dungeon;
        // let step;
        if(data.level==0){
            this.dungeon=1;
            this.step=0;
        }else{
            this.dungeon=Math.floor(data.level / 10);
            this.step=data.level%10;
            if(this.step==3){
                if(this.isLast()){

                }
                else{
                    this.dungeon++;
                    this.step=0;
                }
            }
        }
        
        // fge
        resources.load("dungeon/"+this.dungeon+"/spriteFrame", SpriteFrame, (err, res) => {
            if (err) {
              console.log("资源不存在",err);
            }
            this.node.getChildByName("NodeBg").getChildByName("imgDungeon").getComponent(Sprite).spriteFrame=res;
        });
        // console.log("加载头像");
        let obj=this.dungeonData[this.dungeon-1];
        this.node.getChildByName("Top").getChildByName("bg_lb").getChildByName("LbTitle").getComponent(Label).string=obj.title;
        this.node.getChildByName("LbInfo").getComponent(Label).string=obj.info;
        let nodeStep=this.node.getChildByName("NodeHead");
        console.log("nodeStep.children>>>",nodeStep.children);
        // return;
        for(let i=0;i<nodeStep.children.length;i++){
            let head=nodeStep.children[i];
            // console.log(i,"obj",obj)
            resources.load("head/"+obj.step[i]+"/spriteFrame", SpriteFrame, (err, res) => {
                if (err) {
                  console.log("资源不存在",err);
                }
                head.getChildByName("head").getComponent(Sprite).spriteFrame=res;
            });
            head.getChildByName("LbName").getComponent(Label).string=GameConfig.getCardDataById(obj.step[i]).cardName;
            

            head.getChildByName("LbComplete").active=this.step>=i;
            head.getChildByName("LbComplete").getComponent(Label).string=this.step==i?"当前挑战":"已挑战"

            head.getChildByName("rect_light").active=this.step==i;
            if(this.step==i){
                //tween
                tween(head.getChildByName("rect_light")).delay(0.5).hide().delay(0.5).show().union().repeatForever().start();
            }
        }

    }
    reqMatchError(data:unknown){
        Toast.toast("先点击编辑卡组新建或启用匹配卡组！");
    }
    reqMatchSuccess(data:unknown){
        console.log("服务器匹配成功事件 切换场景 游戏开始",data);
        director.loadScene("game");
    }
}


