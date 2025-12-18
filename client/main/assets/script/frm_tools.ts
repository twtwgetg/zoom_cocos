import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { frmbase } from './frmbase';
import { Main } from './main';
import { item_tools, ItemType, ToolsType } from './item_tools';
import { frm_main } from './frm_main';
import { tools } from './tools';
import { musicmgr } from './musicmgr';
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
    node_video:Node = null!;
    start() {
        this.node_share= instantiate(this.prefab_item);
        this.node_share.setParent(this.node_list);
        this.node_share.getComponent(item_tools).setFunType(ToolsType.share);
        
        this.node_video= instantiate(this.prefab_item);
        this.node_video.setParent(this.node_list);
        this.node_video.getComponent(item_tools).setFunType(ToolsType.video);

        // 设置道具节点的缩放，确保它们以正确的尺寸显示
        this.node_share.scale = new Vec3(1, 1, 1);
        this.node_video.scale = new Vec3(1, 1, 1);

        this.btn_close.node.on(Button.EventType.CLICK,()=>{
            frm_main.isPause=false; 
            this.dt.autouse();//自动使用道具
            this.hide();
        })

    }
    
    protected OnShow(): void {
        super.OnShow();
        this.oldmusicenable=musicmgr.bMusicEnable;
        musicmgr.bMusicEnable=false;
    }
    protected OnHide(): void {
        super.OnHide();
        musicmgr.bMusicEnable=this.oldmusicenable;
    }
    oldmusicenable:boolean=true;//记录之前的音乐状态
    protected onLoad(): void {
        Main.RegistEvent("event_tools",(x)=>{ 
            console.log("event_tools");
            this.show();
            frm_main.isPause=true;
            
            this.setItemType(x);
            return null;
        });
        Main.RegistEvent("event_reward",(x)=>{ 
            frm_main.isPause=false;
            if(x) {
                let num=2;
                if(this.dt.tp==ItemType.brush)     {
                    tools.num_brush+=num;
                } else if(this.dt.tp==ItemType.time) {
                    tools.num_time+=num;
                }
                else if(this.dt.tp==ItemType.remind) {
                    tools.num_Remind+=num;
                }
                else if(this.dt.tp==ItemType.layer) {
                    tools.num_layer+=num;
                }
                else{
                    console.error('道具使用错误'+this.dt.tp);
                }
                this.dt.autouse(); // 自动使用道具
            }
            else{
                //视频播放失败，没有奖励
            }

            this.hide();    // 激励视频播放完毕，关闭道具界面
            return null;
        });

    }
    dt:any;
    setItemType(dt) {
        this.dt=dt;
        switch (dt.tp) {
            case ItemType.time:
                this.lbl_title.string = "冰封道具";
                break;
            case ItemType.remind:
                this.lbl_title.string = "提醒道具";
                break;
            case ItemType.brush:
                this.lbl_title.string = "刷新道具";
                break;
            case ItemType.layer:
                this.lbl_title.string = "消除道具";
            default:
                break;
        }
        this.node_share.getComponent(item_tools).setItemType(dt);
        this.node_video.getComponent(item_tools).setItemType(dt);//(this.funtype);
    }
    update(deltaTime: number) {
        
    }
}