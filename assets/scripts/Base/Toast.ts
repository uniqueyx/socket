import { Color, Director, director, find, Graphics, instantiate, Label, Layers, Node, Prefab, resources, tween, UITransform, Vec2, Vec3 } from "cc";
import { AlertControl } from "../Common/AlertControl";

export default class Toast{
  
  //静态方法
  /**Alert*/  
  private static alertPrefab:Prefab;
  private static alertNode:Node;// 特别注意 切换场景后 alertNode.parent会被销毁 需要重新赋值
  public static alert(str:string,showBtCancel:boolean=true,call:Function=null,cancel:Function=null){
    if(this.alertPrefab)    {
        // console.log("存在 alertprefab");
        this.initAlert(str,showBtCancel,call,cancel);
    }    
    else{
        // console.log("不存在 alertprefab  load");
        resources.load("prefabs/Alert", Prefab, (err, res) => {
            if (err) {
              console.log("加载错误"+err);
              return;
            }
            this.alertPrefab=res;
            this.initAlert(str,showBtCancel,call,cancel);
        });
    }
  }
  private static initAlert(str:string,showBtCancel:boolean=true,call:Function=null,cancel:Function=null){
    // console.log("initAlert");
    const Canvas = find("Canvas");
    // const CanvasSize = Canvas.getComponent(UITransform).contentSize;
    
    if(!this.alertNode||!this.alertNode.parent) {
        // console.log("不存在 alertNode");
        this.alertNode= instantiate(this.alertPrefab);
        this.alertNode.setPosition(0,0);
        this.alertNode.setParent(Canvas);
    }else{
        // console.log("存在 alertNode");
        this.alertNode.active=true;
    }
     
    let aControl=this.alertNode.getComponent(AlertControl);
    aControl.show(str,showBtCancel,call,cancel);
  }
  //隐藏alert弹窗
  public static alertHide(){
    if(this.alertNode) this.alertNode.active=false;
  }
  
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
  /**显示提示tip框*/
  private static tipNode:Node;
  public static showTip(str:string,pos:Vec3|Vec2){
        const Canvas = find("Canvas");
        const CanvasSize = Canvas.getComponent(UITransform).contentSize;
        if(!this.tipNode||!this.tipNode.parent){
            this.tipNode = new Node();
            this.tipNode.layer = Layers.Enum.UI_2D;
            this.tipNode.parent = Canvas;

            //tip背景
            this.tipNode.addComponent(Graphics);
            // const g = this.tipNode.addComponent(Graphics);
            // g.rect(CanvasSize.width / -2, -50 / 2, 720, 50);
            // g.fillColor = new Color(0, 0, 0, 150);//填充
            // g.stroke();
            // g.fill();
            //飘字背文本
            const txtNode = new Node("txt");
            txtNode.layer = Layers.Enum.UI_2D;
            txtNode.parent = this.tipNode;
            let lb=txtNode.addComponent(Label);
            // lb.isBold=true;
            lb.fontSize=25;
            txtNode.setPosition(0, 0);
        }else{
            this.tipNode.active=true;
        }

        //设置文本后需要强制渲染 不然取不到真实宽度
        this.tipNode.getChildByName("txt").getComponent(Label).string = str;
        this.tipNode.getChildByName("txt").getComponent(Label).updateRenderData();
        let w=this.tipNode.getChildByName("txt").getComponent(UITransform).width;
        // console.log(this.tipNode.getChildByName("txt").getComponent(UITransform).width,"文本宽度",str);
        console.log(this.tipNode.getChildByName("txt").getComponent(Label))
        //根据文字内容宽度调整背景色大小
        let h=40;
        let g=this.tipNode.getComponent(Graphics);
        g.clear();
        g.fillColor = new Color(0, 0, 0, 150);//填充
        g.rect(-w/2-5,-h/2,w+10,h);
        g.stroke();
        g.fill();

        // let left=-w/2-5;
        // let right=w/2+5;
        // let top=h/2;
        // let bottom=-h/2;
        if(pos.x<w/2+5) pos.x=w/2+5;
        if(pos.x>CanvasSize.width-w/2-5){
            pos.x=CanvasSize.width-w/2-5;
        }
        if(pos.y+20>CanvasSize.height-20){
            pos.y-=60;
        }else{
            pos.y+=50;
        }

        this.tipNode.setWorldPosition(new Vec3(pos.x,pos.y));//pos.y+20
        // console.log((w/2+5),(w/2+5-pos.x))
        // console.log(pos.x,pos.x<(w/2+5)?(w/2+5-pos.x):pos.x)
  }
    /**hide  tip*/
  public static hideTip(){
    if(this.tipNode) this.tipNode.active=false;
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
