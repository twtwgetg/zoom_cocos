import { _decorator, Component, Node } from 'cc';
import { Main } from '../main';
const { ccclass, property } = _decorator;

@ccclass('playsound')
export class playsound extends Component {
    @property(String)
    sound: string = 'event_click';
    start() {
        this.node.on('click', () => {
           Main.DispEvent(this.sound); //播放声音
        });
    }

    update(deltaTime: number) {
        
    }
}


