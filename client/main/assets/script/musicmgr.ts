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
    @property(AudioClip)
    win: AudioClip = null!;
    @property(AudioClip)
    faild: AudioClip = null!;
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
        Main.RegistEvent("game_win", (x) =>
        {
            this.source.stop(); //停止
            this.source.loop=false;
            this.source.clip = this.win;
            this.source.play(); //播放
            return null;
        });
        Main.RegistEvent("game_lose", (x) =>
        {
            this.source.stop(); //停止
            this.source.clip = this.faild;
            this.source.loop=false;
            this.source.play(); //播放
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


