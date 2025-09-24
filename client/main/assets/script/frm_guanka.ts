import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Sprite, UITransform } from 'cc';
import { frmbase } from './frmbase';
import { Main,platform } from './main';
import { LevelMgr } from './levelmgr';
import { item_guank } from './item_guank';
import { EntrySceneChecker } from './EntrySceneChecker';
const { ccclass, property } = _decorator;
//declare const tt: any;
@ccclass('frm_guanka')
export class frm_guanka extends frmbase {
    
    //添加一个预制体变量，用于存放关卡预制体
    @property(Node)
    public trans_guanka: Node = null!;
    @property(Prefab)
    public prefab_guanka1: Prefab = null!;
    @property(Button)
    btn_addtodesktop: Button = null!;
    @property(Prefab)
    public prefab_sprite: Prefab = null!;
    @property(Button)
    public btn_back: Button = null!;
    @property(Label)
    public lbl_level: Label = null!;
    @property(Node)
    public trans_anis: Node = null!;
    @property(Button)
    public btn_tiaozhan: Button = null!;
    @property(Button)
    public btn_libao: Button = null!;
    @property(Button)
    public btn_lingqu: Button = null!;
    start() {
        if(Main.plat == platform.WECHAT){
            this.btn_libao.node.active = false;
            this.btn_lingqu.node.active = false;
        }
        this.btn_addtodesktop.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_addtodesktop");
        }, this);
        this.btn_back.node.on(Button.EventType.CLICK, ()=>{
            Main.DispEvent('game_begin');
        }, this);
        this.btn_tiaozhan.node.on(Button.EventType.CLICK, ()=>{
            Main.DispEvent('event_play',LevelMgr.level);
        }, this);
        //this.fillGuanKa();
        this.brushGuanKa();
    }
    /**
     *  设置当前关卡
     */
    brushGuanKa() { 
        this.lbl_level.string = "当前关卡：" + (LevelMgr.level + 1);
        let count = LevelMgr.getCount(LevelMgr.level) ;
        for(let i = 0; i < count; i++) {
            var nx = instantiate(this.prefab_sprite);
            //nx.setPosition(i*20,0);
            this.trans_anis.addChild(nx);
            nx.getComponent(Sprite).spriteFrame = Main.DispEvent('event_getsprite',LevelMgr.level+1+i);
        }
    }

    fillGuanKa() {
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
    protected OnShow(): void {
        super.OnShow();
        this.brushlibao();
    }
    brushlibao(): void { 
        if(Main.plat == platform.BYTE) {
            this.btn_libao.node.active = !EntrySceneChecker.isFromSidebar;
            this.btn_lingqu.node.active = EntrySceneChecker.isFromSidebar;
        } 
    }

    protected onLoad(): void {
        super.onLoad();
        this.btn_libao.node.active = false;
        this.btn_lingqu.node.active = false; 
        Main.RegistEvent("event_begin",(x)=>{
            this.show();
            return null;
        });
        Main.RegistEvent("event_inited",(x)=>{ 
            this.brushGuanKa();
            return null;
        });
        Main.RegistEvent("game_begin",(x)=>{
            this.hide();
            return null;
        });
        Main.RegistEvent("event_play",(x)=>{
            this.hide();
            return null;
        });
        Main.RegistEvent("event_lingqu",(x)=>{ 
            if(Main.plat==platform.BYTE){ 
                this.btn_lingqu.node.active = false;
                this.btn_libao.node.active = false;
            }
            return null;
        });
        Main.RegistEvent("event_enterbrush",(x)=>{ 
            this.brushlibao();
        });
        this.btn_libao.node.on(Button.EventType.CLICK, ()=>{
            
            Main.DispEvent('event_cebianlan',false);
        }, this);
        this.btn_lingqu.node.on(Button.EventType.CLICK, ()=>{
            
            Main.DispEvent('event_cebianlan',true);
        }, this);
    }

    update(deltaTime: number) {
        
    }
}

