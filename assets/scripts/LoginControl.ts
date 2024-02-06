import { _decorator, Component, Node, EditBox, director, sys } from 'cc';
import Toast from './Base/Toast';
import GameConfig from './Base/GameConfig';
import { AudioManager } from './Base/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('LoginControl')
export class LoginControl extends Component {

    accountEditBox: EditBox;
    passwordEditBox: EditBox;
    accountRegisterEditBox: EditBox;
    passwordRegisterEditBox: EditBox;
    nickRegisterEditBox:EditBox;
    onLoad(){
        this.accountEditBox = this.node.getChildByName("NodeLogin").getChildByName("EbAccount").getComponent(EditBox);
        this.passwordEditBox = this.node.getChildByName("NodeLogin").getChildByName("EbPassword").getComponent(EditBox);
        this.accountRegisterEditBox = this.node.getChildByName("NodeRegister").getChildByName("EbAccount").getComponent(EditBox);
        this.passwordRegisterEditBox = this.node.getChildByName("NodeRegister").getChildByName("EbPassword").getComponent(EditBox);
        this.nickRegisterEditBox = this.node.getChildByName("NodeRegister").getChildByName("EbNick").getComponent(EditBox);
        let dataStorage=JSON.parse(sys.localStorage.getItem("sgCardUser"));
        // console.log("sgCardUser",dataStorage);
        if(dataStorage){
          GameConfig.USER_DATA=dataStorage;
            this.accountEditBox.string=dataStorage.account;
            this.passwordEditBox.string=dataStorage.password;
        }
        
    }
    start() {

    }

    update(deltaTime: number) {
        
    }

    //按钮事件
    async onBtLogin(){
        console.log("点击登录")
        AudioManager.inst.playOneShot("audio/bt_back");
        if (!this.accountEditBox.string ) {
            Toast.toast("请输入用户名");
            return;
          }
          if (!this.passwordEditBox.string) {
            Toast.toast("请输入密码");
            return;
          }  
      
          const account = this.accountEditBox.string;//crypt.encrypt(this.accountEditBox.string);
          const password = this.passwordEditBox.string;//crypt.encrypt(this.passwordEditBox.string);
      
        //   if (!account || !password) {
        //     console.log("用户名密码加密失败");
        //     return;
        //   }
      
          const params = {
            account,
            password,
          };
          //http://localhost   http://192.168.101.8   http://192.168.71.1
          // try{
            // const { result, data, message } = await fetch(GameConfig.IP+":3004/login", {
            const res = await fetch(GameConfig.IP+":3004/login", {
              method: "POST",
              body: JSON.stringify(params),
              headers: {
                "Content-Type": "application/json",
              },
            }).then((res) => res.json()).catch((error)=>{
              // Toast.toast("服务器连接失败！");
              // console.log("1111",error);
            });
            console.log("登录结果",res);
            // console.log("code", result, data, message);
            if(!res) {
              Toast.toast("服务器连接失败！");
              return;
            }
            if(res.message){
              Toast.toast(res.message);
              return;
            }
            if (res.result == 1) {
              // 登录成功，连接游戏服务器
              console.log("登陆成功",res.data);
              // await this.connect(data.token);
              director.loadScene("hall");
              let obj={account:account,password:password,uid:res.data.uid,nick:res.data.nick};
              GameConfig.USER_DATA=obj;
              sys.localStorage.setItem("sgCardUser",JSON.stringify(obj))
            } 

          // }catch(error){
          //   Toast.toast("服务器连接失败！");
          //   console.error(2222,error);
          // }
          
    }
    onBtOpenRegister(){
      AudioManager.inst.playOneShot("audio/bt_back");
        this.node.getChildByName("NodeRegister").active=true;

    }
    onBtReturn(){
      AudioManager.inst.playOneShot("audio/bt_back");
        this.node.getChildByName("NodeRegister").active=false;

    }
    async onBtRegister(){
      AudioManager.inst.playOneShot("audio/bt_back");
        if (!this.accountRegisterEditBox.string ) {
            Toast.toast("请输入用户名");
            return;
          }
          if ( !this.passwordRegisterEditBox.string) {
            Toast.toast("请输入密码");
            return;
          }
          if ( !this.nickRegisterEditBox.string) {
            Toast.toast("请输入昵称");
            return;
          }
          
          const account = this.accountRegisterEditBox.string;
          const password = this.passwordRegisterEditBox.string;
          const nick = this.nickRegisterEditBox.string;
          const params = {
            account,
            password,
            nick
          };
          // try{
            const res = await fetch(GameConfig.IP+":3004/register", {
              method: "POST",
              body: JSON.stringify(params),
              headers: {
                "Content-Type": "application/json",
              },
            }).then((res) => res.json()).catch((error)=>{
              // Toast.toast("服务器连接失败！");
              console.log("res",res,error)
              // console.log("1111",error);
            });;

            console.log("注册结果", res);
            if(!res) {
              Toast.toast("服务器连接失败！");
              return;
            }
            if(res.message){
              Toast.toast(res.message);
              return;
            }
            if(res.result==1){
              Toast.toast("注册成功！");
              this.node.getChildByName("NodeRegister").active=false;
            }
          // }catch(error){
          //   // Toast.toast("服务器连接失败！");
          //   // console.error(2222,error);
          // }
    }
}


