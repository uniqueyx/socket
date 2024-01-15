import { Color, find, Graphics, Label, Layers, Node, tween, UITransform, Vec3 } from "cc";

export default class Toast{
  
  //静态方法
  /**飘字提醒对象池*/
  private static toastPools: Array<Node> = [];
  /**显示飘字提醒*/
  public static toast(str: string) {
      let toastNode:Node = this.toastPools.shift();
      if (!toastNode||!toastNode.parent) {
          //屏幕节点
          const Canvas = find("Canvas");
          const CanvasSize = Canvas.getComponent(UITransform).contentSize;

          //飘字节点
          toastNode = new Node();
          toastNode.layer = Layers.Enum.UI_2D;
          toastNode.parent = Canvas;
          //飘字背景半透明
          const g = toastNode.addComponent(Graphics);
          g.rect(CanvasSize.width / -2, -60 / 2, 720, 60);
          g.fillColor = new Color(0, 0, 0, 150);//填充
          g.stroke();
          g.fill();

          //飘字背文本
          const txtNode = new Node("txt");
          txtNode.layer = Layers.Enum.UI_2D;
          txtNode.parent = toastNode;
          txtNode.addComponent(Label);
          txtNode.setPosition(0, 0);

      }
      
      // if(!toastNode.parent){
      //   let c=find("Canvas");
      //   if(c) toastNode.parent = c;
      // }
      // if(toastNode.children==undefined||!toastNode.children){
      //   console.log("是否canvas不存在了？",toastNode.parent,"<<<<<<<<<<<<<<<<<<<<<<<<<<<<有bug toastNode.children");
      //   return;
      // } 
      toastNode.getChildByName("txt").getComponent(Label).string = str;
      toastNode.setPosition(0, -100, 0);
      toastNode.setScale(1, 1, 1);

      tween(toastNode)
          .to(0.5, { position: new Vec3(0, 100, 0) })
          .delay(1)
          .to(0.2, { position: new Vec3(0, 200, 0), scale: new Vec3(0, 0, 0) })
          .call(() => {
              this.toastPools.push(toastNode);
          })
          .start()
  }
  /**飘字对象池*/
  private static tipPools: Array<Node> = [];
  /**显示飘字*/
  public static tip(str: string,pos:Vec3=new Vec3(0,0,0)) {
      let posInit:Vec3=pos;
      let toastNode:Node = this.tipPools.shift();
      if (!toastNode||!toastNode.parent) {
          //屏幕节点
          const Canvas = find("Canvas");
          const CanvasSize = Canvas.getComponent(UITransform).contentSize;

          //飘字节点
          toastNode = new Node();
          toastNode.layer = Layers.Enum.UI_2D;
          toastNode.parent = Canvas;
          //飘字背景半透明
          // const g = toastNode.addComponent(Graphics);
          // g.rect(CanvasSize.width / -2, -60 / 2, 720, 60);
          // g.fillColor = new Color(0, 0, 0, 150);//填充
          // g.stroke();
          // g.fill();

          //飘字背文本
          const txtNode = new Node("txt");
          txtNode.layer = Layers.Enum.UI_2D;
          txtNode.parent = toastNode;
          let lb=txtNode.addComponent(Label);
          lb.isBold=true;
          lb.fontSize=50;
          txtNode.setPosition(0, 0);

      }

      if(str.charAt(0)=="+"||str.charAt(0)=="-"){
        toastNode.getChildByName("txt").getComponent(Label).color=str.charAt(0)=="+"?Color.GREEN:Color.RED;
      } 
      // console.log("toastNode>>",toastNode);
      // if(!toastNode.parent){
      //   console.log("toastNode.parent>",toastNode.parent);
      //   let canV=find("Canvas");
      //   toastNode.parent = canV//find("Canvas");
      // }
      // if(toastNode.children==undefined||!toastNode.children){
      //   console.log("是否canvas不存在了？",toastNode.parent,"<<<<<<<<<<<<<<<<<<<<<<<<<<<<有bug toastNode.children");
      //   return;
      // } 
      toastNode.getChildByName("txt").getComponent(Label).string = str;
      toastNode.setPosition(posInit);
      toastNode.setScale(1, 1, 1);

      tween(toastNode)
          .to(0.5, { position: new Vec3(posInit.x, posInit.y+30, 0) })
          .delay(0.1)
          .to(0.1, {  scale: new Vec3(0, 0, 0) })
          // .to(0.1, { position: new Vec3(0, 200, 0), scale: new Vec3(0, 0, 0) })
          .call(() => {
              this.tipPools.push(toastNode);
          })
          .start()
  }
}
