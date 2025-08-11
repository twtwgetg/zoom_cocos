import { _decorator, Component, Node, Button, EditBox, Label } from 'cc';
import { Main } from './main';
import { frmbase } from './frmbase';

const { ccclass, property } = _decorator;

@ccclass('frm_login')
export class frm_login extends frmbase {
    

    @property(Button)
    private btn_login: Button = null!;  
    protected onLoad(): void {
        super.onLoad();
        Main.RegistEvent("game_begin", (x) =>
        {
            this.show();
            return null;
        });

        Main.RegistEvent("event_play", (x) =>
        {
            this.hide();
            return null;
        });
        Main.RegistEvent("event_begin", (x) =>
        {
            this.hide();
            return null;
        });
        Main.RegistEvent("event_returnlogin", (x) =>
        {
            this.show();
            return null;
        });
        // 注册按钮点击事件
        if (this.btn_login) {
            this.btn_login.node.on(Button.EventType.CLICK, this.onLoginClick, this);
        }
    } 
    protected OnShow(): void {
        setTimeout(() => {
            Main.DispEvent('event_begin');    
        }, 1000);
    }
    private onLoginClick(): void {
        Main.DispEvent('event_begin');
        // 调用登录逻辑 
    }
}