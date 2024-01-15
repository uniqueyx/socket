export default class GameConfig{
  static TURN_TIME:number=40;//单回合操作时间 秒
  static HANDCARD_COUNT:number = 3;//起始手牌数量
  static HANDCARD_LIMIT:number = 8;//手牌上限
  static TABLEGENERAL_LIMIT:number = 5;//武将卡上限
  static TABLEMAGIC_LIMIT:number = 5;//魔法卡上限
  static INIT_HP:number = 100;//初始士气

  static CARD_DATA:Record<string,any>;//卡牌图鉴基础数据

  //buff
  static BUFF_TAUNT=101;//嘲讽
  static BUFF_SHIELD=102;//圣盾
  static BUFF_ATTACK=401;//攻击变化
  
  //静态方法
  static getCardDataById(id:number):Object{
    const card = GameConfig.CARD_DATA.find(item => item.id === id);
    if(card==undefined) console.log("有BUG 卡牌图鉴中没找到id对应的数据",id); 
    return card;
  }
}
