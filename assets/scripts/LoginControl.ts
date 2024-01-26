import { _decorator, Component, Node, EditBox, director, sys } from 'cc';
import Toast from './Base/Toast';
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
      
          const { result, data, message } = await fetch("http://localhost:3004/login", {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
              "Content-Type": "application/json",
            },
          }).then((res) => res.json());
      
          console.log("code", result, data, message);
          if(message){
            Toast.toast(message);
            return;
          }
          if (result == 1) {
            // 登录成功，连接游戏服务器
            console.log("登陆成功",data);
            // await this.connect(data.token);
            director.loadScene("hall");

            sys.localStorage.setItem("sgCardUser",JSON.stringify({account:account,password:password}))
          } 
    }
    onBtOpenRegister(){
        this.node.getChildByName("NodeRegister").active=true;

    }
    onBtReturn(){
        this.node.getChildByName("NodeRegister").active=false;

    }
    async onBtRegister(){
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
          const res = await fetch("http://localhost:3004/register", {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
              "Content-Type": "application/json",
            },
          }).then((res) => res.json());

          console.log("注册结果", res);
          if(res.message){
            Toast.toast(res.message);
            return;
          }
          if(res.result==1){
            Toast.toast("注册成功！");
            this.node.getChildByName("NodeRegister").active=false;
          }
          
    }
}


