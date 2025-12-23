import { _decorator, Button, Component, Node } from 'cc';
import { frmbase } from './frmbase';
import { Main, platform } from '../main';
import { EntrySceneChecker } from '../EntrySceneChecker';
import { tools } from '../tools';
const { ccclass, property } = _decorator;
declare const tt: any;
@ccclass('frm_cebianlan')
export class frm_cebianlan extends frmbase {
    @property(Button)
    btn_cebianlan: Button = null!;
    @property(Button)
    btn_lingqu : Button = null!;
    @property(Button)
    btn_close: Button = null!;
    start() {
        this.btn_cebianlan.node.on(Button.EventType.CLICK, () => {
            this.hide(); 
            if(Main.plat == platform.BYTE){
                tt.navigateToScene({
                    scene: 'sidebar',
                    fail: console.log,
                    success: console.log
                })     
            }
        });
        this.btn_lingqu.node.on(Button.EventType.CLICK, () => {
            this.hide();
            tools.num_Remind+=1;
            Main.DispEvent('event_lingqu');
        });
        this.btn_close.node.on(Button.EventType.CLICK, () => {
            this.hide();
        });

    }
    protected OnShow(): void {
        super.OnShow();
        this.btn_cebianlan.node.active = !this.isLingqu;
        this.btn_lingqu.node.active = this.isLingqu;
    }
    isLingqu:boolean = false;
    protected onLoad(): void {
        Main.RegistEvent("event_cebianlan",(x)=>{ 
            this.isLingqu=x;
            this.show();
        });
        Main.RegistEvent("event_enterbrush",(x)=>{ 
            this.btn_cebianlan.node.active = !EntrySceneChecker.isFromSidebar;
            this.btn_lingqu.node.active = EntrySceneChecker.isFromSidebar;
        });
    }
    update(deltaTime: number) {
        
    }
}


