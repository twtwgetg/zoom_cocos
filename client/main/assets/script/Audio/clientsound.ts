import { _decorator, Button, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Main } from '../main';
@ccclass('clientsound')
export class clientsound extends Component {
    @property(String)
    click: string = 'event_click';
    start() {
        this.getComponent(Button)!.node.on('click',this.onClick, this);
    }
    onClick(arg0: string, onClick: any, arg2: this) {
        Main.DispEvent(this.click);
    }

    update(deltaTime: number) {
        
    }
}


