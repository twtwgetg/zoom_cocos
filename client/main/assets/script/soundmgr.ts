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


