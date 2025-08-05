import { _decorator, Button, Component, Label, Node } from 'cc';
import { Main } from './main';
import { LevelMgr } from './levelmgr';
import { frmbase } from './frmbase';
import { PlayerPrefb } from './PlayerPrefb';
const { ccclass, property } = _decorator;

@ccclass('frm_result')
export class frm_result extends frmbase {
    @property(Button)
    btn_again_faild: Button = null!;
    @property(Button)
    btn_menu_faild: Button = null!;
   
    @property(Button)
    btn_again_win: Button = null!;
    @property(Button)
    btn_menu_win: Button = null!;
    
  
    @property(Button)
    btn_nextlevel: Button = null!;
    level_played: number = 0;
    @property(Node)
    sucess: Node = null!;
    @property(Node)
    faild: Node = null!;
    @property(Label)
    level_suc: Label = null!;
    @property(Label)
    level_faild: Label = null!;

    @property(Node)
    star_1: Node = null!;
    @property(Node)
    star_2: Node = null!;
    @property(Node)
    star_3: Node = null!;

    @property(Label)
    lbl_soruce_faild: Label = null!;
    @property(Label)
    lbl_source_suc: Label = null!;
    //转成千位进制表示法
    formatNumber(num: number): string {

        //先对num取整，然后转为千进制字符串
        num = Math.floor(num);
        num = Math.abs(num);
        return num.toString().replace(/(\d)(?=(\d{3})+$)/g, ",");
    }
    protected onLoad(): void {
        this.btn_again_faild.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_play",this.level_played);
        }, this);
 
        this.btn_menu_faild.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_begin");
        }, this);

        this.btn_again_win.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_play",this.level_played);
        }, this);
        
         this.btn_menu_win.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_begin");
        }, this);

        this.btn_nextlevel.node.on(Button.EventType.CLICK, () =>
        { 
            if(this.level_played<LevelMgr.realmaxlevel)
            {
                LevelMgr.level = Math.max(LevelMgr.level, this.level_played + 1);
            }
            Main.DispEvent("event_play", this.level_played+1);
        }, this);

 

        Main.RegistEvent("game_win", (x) =>
        {
            this.level_played = x;
            this.sucess.active=true;// .gameObject.SetActive(true);
            this.faild.active=false;

            this.level_suc.string ="关卡："+(this.level_played+1);
            let time = Main.DispEvent("time_used");
            let timer_all = LevelMgr.getTimeAll(this.level_played);
            let per =1- time / timer_all;
            let source = (per * LevelMgr.getSource(this.level_played));
            let  old = PlayerPrefb.getInt("level_"+this.level_played, 0);
            if (source > old)
            {
                PlayerPrefb.setInt("level_"+this.level_played, source);
            }

            this.lbl_source_suc.string =this.formatNumber(source);
            this.brushStar(this.level_played);
            // StartCoroutine(showsource(source_suc, source));
            this.show();
            return null;
        });
        Main.RegistEvent("game_lose", (x) =>
        {
            this.level_played =x;
            this.level_faild.string = "关卡："+(this.level_played+1);
            this.faild.active=true;
            this.sucess.active=false;
            let time = Main.DispEvent("time_used");
            let timer_all = LevelMgr.getTimeAll(this.level_played);
            console.log("time"+time+": time_all"+ timer_all);
            let per = 1- Math.min(time,timer_all)/ timer_all;
            per = Math.max(per,0.1)
            let source = (per * LevelMgr.getSource(this.level_played));
            this.lbl_source_suc.string =this.formatNumber( source);
            // int source = (int)(levelmgr.getSource(level_played)*0.01f);
            // //source_faild.text = getSourceFormat(source);
            // StartCoroutine(showsource(source_faild, source));
            this.show(); 
            return null;
        });
        Main.RegistEvent("gamebegin", (x) =>
        {
            this.hide();
            return null;
        });

        Main.RegistEvent("event_begin", (x) =>
        {
            this.hide();
            return null;
        });

        Main.RegistEvent("event_play", (x) =>
        {
            this.hide();
            return null;
        });
    }
    brushStar(level_played: number) {
        let source = PlayerPrefb.getInt("level_"+level_played,0);
        var normal = LevelMgr.getSource(level_played);
        var bl = source / normal;
        this.star_1.active = bl > 0.1;
        this.star_2.active = bl > 0.5;
        this.star_3.active = bl > 0.9;
    }
    start() {

    }

    update(deltaTime: number) {
        
    }
}


