import { _decorator, Button, Color, Component, Label, Node, ProgressBar, Sprite } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
import { frmbase } from './frmbase';
import { LevelMgr } from './levelmgr';
import { tools } from './tools';
import { ItemType } from './item_tools';
const { ccclass, property } = _decorator;

@ccclass('frm_main')
export class frm_main extends frmbase {
    @property(gridcreator)
    public gridcreator: gridcreator = null!;
    @property(Button)
    btn_refrush: Button = null!;
    @property(Button)
    btn_remind: Button = null!;
    @property(Button)
    btn_time: Button = null!;
    @property(Button)
    btn_pause: Button = null!;
    time_all: number = 0;
    time_now: number = 0;
    @property(ProgressBar)
    progress_time: ProgressBar = null!;
    public static isPause: boolean = true;
    @property(Label)
    lbl_guanka: Label = null!;
    level_playing: number = 0;

    @property(Node)
    ice_node: Node = null!;
    @property(Sprite)
    spr_bar: Sprite = null!;
    fruzonBar(f:boolean){
        if(!f){
            this.spr_bar.color=new Color(255,173,0,255);
            this.ice_node.active=false;
            this.jishi=true;
        }
        else{
            this.spr_bar.color=new Color(0,214,255,255);
            this.ice_node.active=true;
            this.jishi=false;
        }
    }
    protected onLoad(): void {
        super.onLoad();
        let that =this;
        Main.RegistEvent("event_play",(x)=>{ 
            this.show();
            this.scheduleOnce(() => {
                this.gridcreator.Create(x);
                this.time_all = LevelMgr.getTimeAll(x);
                this.time_now = 0;
                this.jishi=true;
                frm_main.isPause = false;
                // 执行你的拦截逻辑
            }, 0);
 
            this.level_playing = x;
            this.lbl_guanka.string = "第 "+(x+1)+" 关";

            return null;
        });

        Main.RegistEvent("event_restart",()=>{ 
            Main.DispEvent("event_play",this.level_playing); 
            return null;
        });
        Main.RegistEvent("event_fruszon",(f)=>{ 
            this.fruzonBar(f);
            return null;
        });
        Main.RegistEvent("update_tools",()=>{ 
            this.brushTools();
            return null;
        });
        Main.RegistEvent("event_begin",()=>{ 
            this.hide();
            return null;
        });
        this.btn_pause.node.on(Button.EventType.CLICK, () =>
        {
            
            Main.DispEvent("event_pause");
        }, this);
        this.btn_refrush.node.on(Button.EventType.CLICK, () =>
        {
            if(tools.num_brush>0)
            {
                tools.num_brush--;
                this.brushTools();
                Main.DispEvent("event_brush");
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.brush,autouse:()=>{
                    if(tools.num_brush>0)
                    {
                        tools.num_brush--;
                        that.brushTools();
                        Main.DispEvent("event_brush");    
                    }
                    else{

                    }
                }});
            }
        }, this);
        this.btn_remind.node.on(Button.EventType.CLICK, () =>
        {
            if(tools.num_Remind>0){
                tools.num_Remind--;
                this.brushTools();
                Main.DispEvent("event_tixing");
            }
            else{
                Main.DispEvent("event_tools",{tp:ItemType.remind,autouse:()=>{
                    if(tools.num_Remind>0){
                        tools.num_Remind--;
                        that.brushTools();
                        Main.DispEvent("event_tixing");    
                    }
                }});
            }
        }, this); 
        this.btn_time.node.on(Button.EventType.CLICK,()=>{
            // 
            // if(frm_main.isPause){
            //     wx.showToast({title:"时间冷却种，请稍后再试"});
            // }
            // else{
                if(tools.num_time>0){
                    tools.num_time--;
                    this.brushTools();
                    Main.DispEvent("event_resettime");    
                }
                else{
                    console.log("no time");
    
                    Main.DispEvent("event_tools",{tp:ItemType.time,autouse:()=>{
                        if(tools.num_time>0){
                            tools.num_time--;
                            that.brushTools();
                            Main.DispEvent("event_resettime");    
                        }
                    }});
                }
            //}
            
        },this);

        Main.RegistEvent("time_used",()=>{
            return this.time_now;
        });
        this.fruzonBar(false);

        this.brushTools();
    }
    brushTools(){ 
        this.btn_time.node.getChildByName("num").getComponent(Label).string = tools.num_time.toString();
        this.btn_remind.node.getChildByName("num").getComponent(Label).string = tools.num_Remind.toString();
        this.btn_refrush.node.getChildByName("num").getComponent(Label).string = tools.num_brush.toString();
    }
    start() {

    }
    jishi:boolean=false;
    update(deltaTime: number) {

        if(frm_main.isPause) 
            return;

        if(!this.jishi) 
            return;

        this.time_now += deltaTime; 
        this.progress_time.progress =1.0- this.time_now / this.time_all; 
        if(this.time_now >= this.time_all) {
            this.jishi=false;
            Main.DispEvent("game_lose",this.level_playing);
        }
    }
}


