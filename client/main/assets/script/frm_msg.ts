import { _decorator, Button, Component, instantiate, Label, Node, Prefab, tween, Vec3 } from 'cc';
import { frmbase } from './frmbase';
import { Main } from './main';
import { frm_main } from './frm_main';
import { soundmgr } from './soundmgr';
import { musicmgr } from './musicmgr';
import { LevelMgr } from './levelmgr';
const { ccclass, property } = _decorator;
declare const tt: any;
@ccclass('frm_msg')
export class frm_msg extends frmbase {
    @property(Button)
    btn_ok: Button = null!;
    @property(Button)
    btn_cancel: Button = null!;
    @property(Label)
    lbl_msg: Label = null!;

    @property(Node)
    trans_top: Node = null!;//关卡


    @property(Prefab)
    prefab_msg: Prefab = null!;
    cb:any;
    protected onLoad(): void {
        super.onLoad();
        this.btn_cancel.node.on(Button.EventType.CLICK,()=>{
            if(this.cb) 
            {
                this.cb(false);
            }
            this.hide();
        });
        this.btn_ok.node.on(Button.EventType.CLICK,()=>{
            if(this.cb) 
            {
                this.cb(true);
            }
            this.hide();
        });
        Main.RegistEvent("event_msg",(x)=>{ 
            this.lbl_msg.string = x.msg;
            this.cb = x.cb;
            this.show();
        });

        // In your event handler
        Main.RegistEvent("event_msg_top",(x)=>{ 
            let xt = instantiate(this.prefab_msg);
            xt.setParent(this.trans_top); 
            
            // Implement tween animation from bottom to top with fade out
            const startPos = new Vec3(0, -100, 0);  // Start position (bottom)
            const endPos = new Vec3(0, 100, 0);    // End position (top)
            xt.position = startPos;
            
            // Make sure the label component is accessible
            const label = xt.getComponent(Label);
            if (label && x.msg) {
                label.string = x.msg;
            }
 
            tween(xt)
            .to(1, { position: endPos })  // 默认自动处理Vec3插值
            .call(() => {
                xt.destroy();
            })
            .start();
            
            tween(label.color)
            .to(1, { a: 0 })  // 默认自动处理Color插值
            .start();
            
        });
    }
}

