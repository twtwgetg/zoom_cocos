import { _decorator, AudioClip, AudioSource, Component, Node, sys } from 'cc';
import { Main } from './main';
import { PlayerPrefb } from './PlayerPrefb';
const { ccclass, property } = _decorator;

@ccclass('musicmgr')
export class musicmgr extends Component {
    @property(AudioSource)
    source: AudioSource = null!;
    @property(AudioClip)
    main: AudioClip = null!;
    @property(AudioClip)
    play: AudioClip = null!;
    @property(AudioClip)
    click: AudioClip = null!;
    // 移除了win和faild音效，因为它们已经被移到soundmgr中
    protected onLoad(): void {
        Main.RegistEvent("game_begin", (x) =>
        {
            this.source.stop(); //停止
            this.source.loop=true;
            this.source.clip = this.main;
            this.source.play(); //播放
            
            return null;
        });
        Main.RegistEvent("event_play", (x) =>
        {
            this.source.stop(); //停止
            this.source.loop=true;
            this.source.clip = this.play;
            this.source.play(); //播放
            return null;
        });
        // 移除了game_win事件处理，因为已经移到soundmgr中
        // 移除了game_lose事件处理，因为已经移到soundmgr中
        
        // 添加游戏结束时停止背景音乐的处理
        Main.RegistEvent("game_win", (x) =>
        {
            // 游戏胜利时停止背景音乐
            this.source.stop();
            return null;
        });
        
        Main.RegistEvent("game_lose", (x) =>
        {
            // 游戏失败时停止背景音乐
            this.source.stop();
            return null;
        });
        
        Main.RegistEvent("event_music_change", (x) =>
        {
            this.source.volume = musicmgr.bMusicEnable?1:0;
            if(musicmgr.bMusicEnable)
            {
                this.source.play();
            }
            return null;
        });
        console.log("musicmgr.bMusicEnable", musicmgr.bMusicEnable);
        this.source.volume = musicmgr.bMusicEnable ? 1:0;
    } 
    static get bMusicEnable() : boolean
    {
        return PlayerPrefb.getInt('music', 1) == 1  ;
    }
    static set bMusicEnable(value: boolean)
    {
        PlayerPrefb.setInt('music', value ? 1 : 0);
        Main.DispEvent("event_music_change");
    }
    update(deltaTime: number) {
        
    }
}