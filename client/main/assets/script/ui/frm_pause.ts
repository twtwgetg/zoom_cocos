import { _decorator, Button, Component, EditBox, Node, Prefab, Sprite } from 'cc';
import { frmbase } from './frmbase';
import { Main } from '../main';
import { frm_main } from './frm_main';
import { soundmgr } from '../Audio/soundmgr';
import { musicmgr } from '../Audio/musicmgr';
import { LevelMgr } from '../levelmgr';
import { gridcreator } from '../gridcreator';
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
    btn_quit: Button = null!;
    @property(Button)
    btn_soundenable: Button = null!;
    @property(Button)
    btn_musicenable: Button = null!;
    @property(Button)
    btn_init: Button = null!;
    
    @property(Button)
    btn_tucao: Button = null!;
    @property(Node)
    panel_tucao:Node = null!;
    @property(Button)
    btn_submit: Button = null!;
    @property(EditBox)
    input_tucao: EditBox = null!;

    // 添加音乐状态变量，用于记录暂停前的音乐状态
    private wasMusicPlaying: boolean = false;
    
    start() {
         this.btn_init.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_msg", {msg:"确定要初始化吗？,之前的游戏等级将被清空",cb:(x)=>{
                if(x)
                {
                    LevelMgr.init(); 
                    Main.DispEvent("event_inited");
                    Main.DispEvent("event_msg_top",{msg:"初始化成功"});
                }
                else{
                    Main.DispEvent("event_msg_top",{msg:"取消初始化"});
                }
            }});
            
        }, this);
        this.btn_tucao.node.on(Button.EventType.CLICK, () =>
        {
            this.panel_tucao.active=true;
        }, this);
        this.btn_quit.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("game_begin");
            this.hide();
        }, this);
        this.btn_submit.node.on(Button.EventType.CLICK, () =>
        {
            let content = this.input_tucao.string;
            if (content.length > 0)
            {
                // 发送反馈 
                this.sendFeedback(content);
                this.panel_tucao.active=false;
            }
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
            this.brushflag();
        },this);
    }
    
    /**
     * 发送用户反馈到服务器
     * @param content 反馈内容
     */
    private sendFeedback(content: string): void {
        const feedbackData = {
            content: content,
            timestamp: Date.now(),
            level: LevelMgr.level,
            platform: Main.plat
        };

        // 使用XMLHttpRequest发送反馈数据
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://www.haoyouqu.net/api/feedback", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("反馈发送成功");
                    Main.DispEvent("event_msg_top", {msg: "感谢您的反馈！"});
                } else {
                    console.error("反馈发送失败:", xhr.status, xhr.statusText);
                    Main.DispEvent("event_msg_top", {msg: "反馈发送失败，请稍后再试"});
                }
            }
        };
        
        try {
            xhr.send(JSON.stringify(feedbackData));
            // 清空输入框
            this.input_tucao.string = "";
        } catch (error) {
            console.error("发送反馈时出错:", error);
            Main.DispEvent("event_msg_top", {msg: "反馈发送出错，请稍后再试"});
        }
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
            // 重置连连看模式动画类型，确保新游戏使用同一种动画效果
            const mainNode = this.node.parent?.getChildByName('frm_main');
            if (mainNode) {
                const frmMain = mainNode.getComponent('frm_main') as any;
                if (frmMain && frmMain.gridcreator) {
                    // 通过gridcreator实例调用静态方法
                    frmMain.gridcreator.constructor.resetLianlianAnimationType();
                }
            }
        });
        Main.RegistEvent("event_restart",(x)=>{ 
            this.hide();
            // 重置连连看模式动画类型，确保重新开始游戏使用同一种动画效果
            const mainNode = this.node.parent?.getChildByName('frm_main');
            if (mainNode) {
                const frmMain = mainNode.getComponent('frm_main') as any;
                if (frmMain && frmMain.gridcreator) {
                    // 通过gridcreator实例调用静态方法
                    frmMain.gridcreator.constructor.resetLianlianAnimationType();
                }
            }
        });
        Main.RegistEvent("event_resume",(x)=>{
            this.hide();
            frm_main.isPause = false;
            // 发送事件通知主游戏界面恢复游戏，以便重新评估是否需要播放心跳音效
            Main.DispEvent("event_resume_game");
            return null;
        });
        Main.RegistEvent("event_restart_sanxiao",(x)=>{ 
            this.hide();
            frm_main.isPause = false;
            // 重新开始三消模式
            Main.DispEvent("event_play_sanxiao");
            return null;
        });
    }
    
    /**
     * 显示暂停界面时暂停背景音乐
     */
    show() {
        super.show();
        
        // 停止心跳音效
        Main.DispEvent("event_heartbeat_stop");
        
        // 记录当前音乐是否正在播放
        const musicManager = musicmgr.instance;
        if (musicManager && musicManager.source) {
            this.wasMusicPlaying = musicManager.source.playing;
            // 暂停背景音乐
            if (this.wasMusicPlaying) {
                musicManager.source.pause();
            }
        }
    }
    
    /**
     * 隐藏暂停界面时恢复背景音乐
     */
    hide() {
        super.hide();
        
        // 恢复背景音乐
        const musicManager = musicmgr.instance;
        if (musicManager && musicManager.source) {
            // 只有在暂停前音乐是播放状态时才恢复播放
            if (this.wasMusicPlaying && musicmgr.bMusicEnable) {
                musicManager.source.play();
            }
        }
    }

    update(deltaTime: number) {
        
    }
     
}