import { Color } from "cc";

export default class GameConfig{
  static TURN_TIME:number=40;//单回合操作时间 秒
  static HANDCARD_COUNT:number = 3;//起始手牌数量
  static HANDCARD_LIMIT:number = 8;//手牌上限
  static TABLEGENERAL_LIMIT:number = 5;//武将卡上限
  static TABLEMAGIC_LIMIT:number = 5;//魔法卡上限
  static INIT_HP:number = 100;//初始士气

  //全局数据
  static CARD_DATA:Record<string,any>;//卡牌图鉴基础数据
  static USER_DATA:any;//玩家信息

  //http://localhost   http://192.168.101.8   http://192.168.71.8
  static IP:string="http://192.168.71.9";
  //buff
  static BUFF_TAUNT=101;//嘲讽
  static BUFF_SHIELD=102;//圣盾
  static BUFF_PROTECT=103;//守护
  static BUFF_DEFENSE=104;//铁壁
  static BUFF_DOUBLE=105;//双击
  static BUFF_ATTACK=401;//攻击变化

  //卡牌稀有度色值
  static COLOR_RARE:Color[]=[Color.WHITE,new Color(33,200,0),Color.BLUE,new Color(255,0,228),new Color(202,126,54)];
  static COLOR_RARE16:string[]=["#ffffff","#21c800","#0000ff","#ff00ff","#ca7e36"];

  //势力名
  static FORCE_NAME:string[]=["","黄巾","东汉","十常侍","盗贼"];
  static FORCE_NAME_ICON:string[]=["","黄","汉","十","盗"];
  
  //静态方法
  static getCardDataById(id:number):any{
    const card = GameConfig.CARD_DATA.find(item => item.id === id);
    if(card==undefined) console.log("有BUG 卡牌图鉴中没找到id对应的数据",id); 
    return card;
  }
  static getBuffString(id:number,value:number=0):string{
    let str="";
    switch(id){
        case this.BUFF_TAUNT:
          str="嘲讽(必须先攻击嘲讽武将)";
          break;
        case this.BUFF_SHIELD:
          str="圣盾(免除一次战斗破坏)";
          break;  
        case this.BUFF_PROTECT:
          str="守护(不会被效果破坏)";
          break;
        case this.BUFF_DEFENSE:
          str="铁壁(战斗受到士气伤害为0)";
          break;  
          case this.BUFF_DOUBLE:
            str="双击(攻击两次)";
            break;        
        case this.BUFF_ATTACK:
          str="攻击"+(value<0?"-"+value:"+"+value);
          break;   
    }
    return str;
  }
}
