import { _decorator, Button, Component, instantiate, Label, Node, Prefab } from 'cc';
import { frmbase } from './frmbase';
import { Main } from './main';
import { item_tools } from './item_tools';
import { frm_main } from './frm_main';
const { ccclass, property } = _decorator;

@ccclass('frm_tools')
export class frm_tools extends frmbase {
    @property(Label)
    lbl_title: Label = null!;
    @property(Prefab)
    prefab_item: Prefab = null!;
    @property(Node)
    node_list: Node = null!;
    @property(Button)
    btn_close: Button = null!;
    
    node_share:Node = null!;
    start() {
        this.node_share= instantiate(this.prefab_item);
        this.node_share.setParent(this.node_list);
        this.node_share.getComponent(item_tools).setFunType(1);
        this.btn_close.node.on(Button.EventType.CLICK,()=>{
            frm_main.isPause=false;
            this.dt.cb();
            this.hide();
        })
    }

    protected onLoad(): void {
        Main.RegistEvent("event_tools",(x)=>{ 
            this.show();
            frm_main.isPause=true;
            this.setType(x);
            return null;
        });
    }
    dt:any;
    setType(dt) {
        this.dt=dt;
        switch (dt.tp) {
            case 0:
                this.lbl_title.string = "冰封道具";
                break;
            case 1:
                this.lbl_title.string = "提醒道具";
                break;
            case 2:
                this.lbl_title.string = "刷新道具";
                break;
            default:
                break;
        }
        this.node_share.getComponent(item_tools).setType(dt);
    }
    update(deltaTime: number) {
        
    }
}


