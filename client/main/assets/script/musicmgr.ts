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
            this.source.clip = this.main;
            this.source.play(); //播放
            return null;
        });
        Main.RegistEvent("event_play", (x) =>
        {
            this.source.stop(); //停止
            this.source.clip = this.play;
            this.source.play(); //播放
            return null;
        });
        Main.RegistEvent("game_win", (x) =>
        {
            this.source.stop(); //停止
            this.source.clip = this.win;
            this.source.play(); //播放
            return null;
        });
        Main.RegistEvent("game_lose", (x) =>
        {
            this.source.stop(); //停止
            this.source.clip = this.faild;
            this.source.play(); //播放
            return null;
        });
        Main.RegistEvent("event_music", (a) =>
        {
            this.source.enabled   = !this.bMusicEnable;
            return null;
        });
    } 
    get bMusicEnable() : boolean
    {
        return PlayerPrefb.getInt('music', 1) == 1  ;
    }
    update(deltaTime: number) {
        
    }
}


