import { _decorator, Component,sys, Node, AudioSource } from 'cc';
import { Main } from './main';
import { PlayerPrefb } from './PlayerPrefb';
const { ccclass, property } = _decorator;

@ccclass('soundmgr')
export class soundmgr extends Component {
   
    @property(AudioSource)
    peng: AudioSource = null!;
    @property(AudioSource)
    click: AudioSource = null!;
    @property(AudioSource)
    slider: AudioSource = null!;
    // 添加心跳音效
    @property(AudioSource)
    heartbeat: AudioSource = null!;
    // 添加胜利和失败音效
    @property(AudioSource)
    win: AudioSource = null!;
    @property(AudioSource)
    fail: AudioSource = null!;
    // 添加消除音效（用于三消模式）
    @property(AudioSource)
    eliminate: AudioSource = null!;

    protected onLoad(): void {
        Main.RegistEvent("event_lian", (parm) =>
        {
            if (soundmgr.bSoundEnable)
            {
                this.peng.play();
            }
            
            return 1;
        });
        Main.RegistEvent("event_click", (parm) =>
        {
            if (soundmgr.bSoundEnable)
            {
                this.click.play();
            }
            return 1;
        });
        Main.RegistEvent("event_sound", (parm) =>
        {

            return null;
        });

        Main.RegistEvent("event_slider", (parm) =>
        {
            if (soundmgr.bSoundEnable)
            {
                this.slider.play();
            }
            return null;
        });
        
        // 注册心跳音效事件
        Main.RegistEvent("event_heartbeat_start", (parm) =>
        {
            if (soundmgr.bSoundEnable)
            {
                // 设置心跳音效循环播放
                this.heartbeat.loop = true;
                this.heartbeat.play();
            }
            return null;
        });
        
        // 注册心跳节拍事件
        Main.RegistEvent("event_heartbeat_beat", (parm) =>
        {
            if (soundmgr.bSoundEnable && this.heartbeat.playing) {
                // 重新播放心跳音效，实现节拍效果
                this.heartbeat.currentTime = 0;
            }
            return null;
        });
        
        // 注册停止心跳音效事件
        Main.RegistEvent("event_heartbeat_stop", (parm) =>
        {
            if (this.heartbeat.playing) {
                this.heartbeat.stop();
            }
            return null;
        });
        
        // 注册胜利音效事件
        Main.RegistEvent("game_win", (parm) =>
        {
            // 游戏胜利时停止心跳音效
            if (this.heartbeat.playing) {
                this.heartbeat.stop();
            }
            
            if (soundmgr.bSoundEnable)
            {
                this.win.play();
            }
            return null;
        });
        
        // 注册失败音效事件
        Main.RegistEvent("game_lose", (parm) =>
        {
            // 游戏失败时停止心跳音效
            if (this.heartbeat.playing) {
                this.heartbeat.stop();
            }
            
            if (soundmgr.bSoundEnable)
            {
                this.fail.play();
            }
            return null;
        });
        
        // 注册消除音效事件（用于三消模式）
        Main.RegistEvent("event_add_jifen", (parm) =>
        {
            if (soundmgr.bSoundEnable)
            {
                this.eliminate.play();
            }
            return null;
        });
    }
    static get bSoundEnable() : boolean
    {
        return PlayerPrefb.getInt('sound', 1)==1;
    }
    static set bSoundEnable(value: boolean)
    {
        PlayerPrefb.setInt('sound', value ? 1 : 0);
    }
    update(deltaTime: number) {
        
    }
}