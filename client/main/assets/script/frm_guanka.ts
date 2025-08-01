import { _decorator, Component, instantiate, Node, Prefab, UITransform } from 'cc';
import { frmbase } from './frmbase';
import { Main } from './main';
import { LevelMgr } from './levelmgr';
import { item_guank } from './item_guank';
const { ccclass, property } = _decorator;

@ccclass('frm_guanka')
export class frm_guanka extends frmbase {
    
    //添加一个预制体变量，用于存放关卡预制体
    @property(Node)
    public trans_guanka: Node = null!;
    @property(Prefab)
    public prefab_guanka1: Prefab = null!;
    start() {
        var all=Main.DispEvent('event_getallsprites');
        for(var i=0;i<LevelMgr.realmaxlevel;i++)
        {
            var node=instantiate(this.prefab_guanka1);
            node.name=all[i];
            node.getComponent(item_guank).setLevel(i);
            node.setPosition(-431.5035,0);
            this.trans_guanka.addChild(node);
        }

        //设置trans_guanka的高度为关卡数量乘以预制体的高度
        //设置trans_guanka的高度为关卡数量乘以预制体的高度
        const uiTransform = this.trans_guanka.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(0, all.length * this.prefab_guanka1.data.getComponent(UITransform)?.height || 0);
        }
        this.trans_guanka.setPosition(0, 0); 
    }
    protected onLoad(): void {
        super.onLoad();
        Main.RegistEvent("event_begin",(x)=>{
            this.show();
            return null;
        });
        Main.RegistEvent("event_play",(x)=>{
            this.hide();
            return null;
        });
    }

    update(deltaTime: number) {
        
    }
}

