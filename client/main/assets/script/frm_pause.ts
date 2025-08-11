import { _decorator, Button, Component, Node } from 'cc';
import { frmbase } from './frmbase';
import { Main } from './main';
import { frm_main } from './frm_main';
import { soundmgr } from './soundmgr';
import { musicmgr } from './musicmgr';
import { LevelMgr } from './levelmgr';
const { ccclass, property } = _decorator;

@ccclass('frm_pause')
export class frm_pause extends frmbase {
    @property(Button)
    btn_resume: Button = null!;
    @property(Button)
    btn_restart: Button = null!;
    @property(Button)
    btn_menu:Button = null!;
    @property(Button)
    btn_soundenable: Button = null!;
    @property(Button)
    btn_musicenable: Button = null!;
    @property(Button)
    btn_init: Button = null!;
    start() {
         this.btn_init.node.on(Button.EventType.CLICK, () =>
        {
            LevelMgr.init();
        }, this);
        this.btn_resume.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_resume");
        }, this);
        this.btn_restart.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_restart");
        }, this);
        this.btn_menu.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_begin");
        }, this);

        this.btn_soundenable.node.on(Button.EventType.CLICK, ()=>{
            soundmgr.bSoundEnable = !soundmgr.bSoundEnable;
            this.brushflag();
        },this);
        this.btn_musicenable.node.on(Button.EventType.CLICK, ()=>{
            musicmgr.bMusicEnable = !musicmgr.bMusicEnable;
            Main.DispEvent("event_music_change");
            this.brushflag();
        },this);
    }
    brushflag()
    {
        console.log('musicenable='+musicmgr.bMusicEnable)
        this.btn_musicenable.node.getChildByName('mask').active = !musicmgr.bMusicEnable;
        this.btn_soundenable.node.getChildByName('mask').active = !soundmgr.bSoundEnable;
    }
    level_playing: number = 0;
    protected onLoad(): void {
        super.onLoad();
        Main.RegistEvent("event_pause",(x)=>{
            frm_main.isPause = true;
            this.show();
            this.level_playing = x;
            this.brushflag();
            return null;
        });
        Main.RegistEvent("event_begin",(x)=>{ 
            this.hide();
        });
        Main.RegistEvent("event_restart",(x)=>{ 
            this.hide();
        });
        Main.RegistEvent("event_resume",(x)=>{
            this.hide();
            frm_main.isPause = false;
            return null;
        });
    }

    update(deltaTime: number) {
        
    }
}

