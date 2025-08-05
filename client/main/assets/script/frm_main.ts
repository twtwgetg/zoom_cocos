import { _decorator, Button, Component, Label, Node, ProgressBar } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
import { frmbase } from './frmbase';
import { LevelMgr } from './levelmgr';
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
    time_all: number = 0;
    time_now: number = 0;
    @property(ProgressBar)
    progress_time: ProgressBar = null!;
    public static isPause: boolean = true;
    @property(Label)
    lbl_guanka: Label = null!;
    level_playing: number = 0;
    protected onLoad(): void {
        super.onLoad();
        Main.RegistEvent("event_play",(x)=>{ 
            this.show();
            this.gridcreator.Create(x);
            this.level_playing = x;
            this.lbl_guanka.string = "第 "+(x+1)+" 关";
            this.time_all = LevelMgr.getTimeAll(x);
            this.time_now = 0;
            frm_main.isPause = false;

            return null;
        });
 
        this.btn_refrush.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_brush");
        }, this);
        this.btn_remind.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_tixing");
        }, this); 
        this.btn_time.node.on(Button.EventType.CLICK,()=>{
            Main.DispEvent("event_resettime");
        },this);

        Main.RegistEvent("time_used",()=>{
            return this.time_now;
        });
    }
    start() {

    }

    update(deltaTime: number) {
        if(frm_main.isPause) 
            return;
        this.time_now += deltaTime;
    
        this.progress_time.progress =1.0- this.time_now / this.time_all;
    
        if(this.time_now >= this.time_all) {
            frm_main.isPause = true;
            Main.DispEvent("game_lose",this.level_playing);
        }
    }
}


