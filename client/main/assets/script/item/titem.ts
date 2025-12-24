import { __private, _decorator, Button, Component, Label, Node, Sprite, SpriteFrame, Vec3 } from 'cc';
import { ItemType } from './item_tools';
import { Main } from '../main';
import { tools } from '../tools';
import { ToutiaoEventMgr } from '../ToutiaoEventMgr';
import { frm_main } from '../ui/frm_main';
import { frm_guide } from '../ui/frm_guide';

const { ccclass, property } = _decorator;

@ccclass('titem')
export class titem  extends Component {
    init(arg0: { tp: ItemType; }, num: number) {
        this.setItemType(arg0);
        this.setNum(num);
        this.node.on(Button.EventType.CLICK,this.onClick,this); 
        Main.RegistEvent("event_itemchanged",(x)=>this.onItemChanged(x));
        Main.RegistEvent("update_tools",(x)=>this.brushTools());
        
        // 确保道具节点以正确的尺寸显示
        this.node.scale = new Vec3(1, 1, 1);
    }
    onItemChanged(x){
        this.brushTools();
        return null;
    }
    protected onDestroy(): void {
        Main.UnRegistEvent("event_itemchanged",this.onItemChanged);
    }
    brushTools() {
        switch (this.itemtype) {
            case ItemType.time: 
                this.setNum(tools.num_time); 
                break;
            case ItemType.remind: 
                this.setNum(tools.num_Remind);
                break;
            case ItemType.brush: 
                this.setNum(tools.num_brush);
                break;
            case ItemType.layer: 
                this.setNum(tools.num_layer);
                break;
            case ItemType.ShowFront: 
                this.setNum(tools.num_ShowFront);
                break;
                
            default:
                break;
        }
    }

    onClick() {
        if(frm_guide.isShow ){
            if(frm_guide.remind != this){
                return;
            }
            frm_guide.state++; 
        }
        let that = this;
        if(this.itemtype == ItemType.time)
        {
            if(Main.DispEvent("event_isfruszon")){
                Main.DispEvent("event_msg_top",{msg:"时间冷却中..."});
            }
            else{
                if(tools.num_time>0){
                    tools.num_time--;
                    this.setNum(tools.num_time);
                    Main.DispEvent("event_resettime");     
                 
                    // 在无限模式下，使用时间道具可以停止生成新卡牌
                    if (frm_main.isInfinityMode) {
                        frm_main.stopInfiniteModeGenerator = true;
                        Main.DispEvent("event_msg_top",{msg:"时间道具已使用，停止生成新卡牌"});
                    }
                    
                    // 上报使用道具事件
                    ToutiaoEventMgr.reportUseItem(3); // 3表示时间道具
                }
                else{
                    console.log("no time");
                
                    Main.DispEvent("event_tools",{tp:ItemType.time,autouse:()=>{
                          that.setNum(tools.num_time);
                          // 上报使用道具事件
                          ToutiaoEventMgr.reportUseItem(3); // 3表示时间道具
                    }});
                }
            }
            
        } else if(this.itemtype == ItemType.remind) {
            if(tools.num_Remind>0){
                tools.num_Remind--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用提醒道具..."});
                Main.DispEvent("event_tixing");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(2); // 2表示提醒道具
                // 停止提醒道具按钮闪烁
                //frm_main.stopRemindButtonFlashing();
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.remind,autouse:()=>{
                    // if(tools.num_Remind>0){
                    //     tools.num_Remind--;
                        that.brushTools();
                        // 上报使用道具事件
                        ToutiaoEventMgr.reportUseItem(2); // 2表示提醒道具
                        // 停止提醒道具按钮闪烁
                        //frm_main.stopRemindButtonFlashing();
                    //     Main.DispEvent("event_tixing");    
                    // }
                }});
            }
        }
        else if(this.itemtype == ItemType.brush){
             if(tools.num_brush>0)
            {
                tools.num_brush--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用刷新道具"});
                Main.DispEvent("event_brush");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(1); // 1表示刷新道具
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.brush,autouse:()=>{ 
                    that.brushTools();
                    // 上报使用道具事件
                    ToutiaoEventMgr.reportUseItem(1); // 1表示刷新道具 
                }});
            }
        }
        else if(this.itemtype == ItemType.layer){
            if(tools.num_layer>0)
            {
                tools.num_layer--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用清除道具"});
                Main.DispEvent("event_layer_clear");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(4); // 4表示清除道具
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.layer,autouse:()=>{ 
                    that.brushTools();
                    // 上报使用道具事件
                    ToutiaoEventMgr.reportUseItem(4); // 4表示清除道具
                }});
            }
        }
        else if(this.itemtype == ItemType.ShowFront){
            if(tools.num_ShowFront>0)
            {
                tools.num_ShowFront--;
                this.brushTools();
                Main.DispEvent("event_msg_top",{msg:"使用记忆道具"});
                Main.DispEvent("event_showfront");
                // 上报使用道具事件
                ToutiaoEventMgr.reportUseItem(ItemType.ShowFront); // 4表示记忆道具
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.ShowFront,autouse:()=>{ 
                    that.brushTools();
                    // 上报使用道具事件
                    ToutiaoEventMgr.reportUseItem(ItemType.ShowFront); // 4表示记忆道具
                }});
            }
        }
        else{
            console.log("no item");
        }
    }
    @property(Label)
    lbl_num: Label = null!;
    setNum(num: number) {
        this.lbl_num.string = num.toString();
    }
    @property(SpriteFrame)
    sprite_layer: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_time: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_remind: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_refrush: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_ShowFront: SpriteFrame = null!;
    @property(Sprite)
    image_icon: Sprite = null!;

    itemtype: ItemType = ItemType.remind;
    dt:any
    setItemType(dt:any) {
        this.dt = dt;
        this.itemtype = dt.tp;
        switch (this.itemtype) {
            case ItemType.time: 
                this.image_icon.spriteFrame = this.sprite_time; 
                break;
            case ItemType.remind: 
                this.image_icon.spriteFrame = this.sprite_remind;
                break;
            case ItemType.brush: 
                this.image_icon.spriteFrame = this.sprite_refrush;
                break;
            case ItemType.layer:
                this.image_icon.spriteFrame = this.sprite_layer;
                break;
            case ItemType.ShowFront:
                this.image_icon.spriteFrame = this.sprite_ShowFront;
                break;
            default:
                console.error("no item"+this.itemtype);
                break;
        }
    }
}