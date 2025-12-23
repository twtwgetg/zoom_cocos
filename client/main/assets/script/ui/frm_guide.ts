import { _decorator, Component, Node } from 'cc';
import { frmbase } from './frmbase';
import { Main } from '../main';
const { ccclass, property } = _decorator;

@ccclass('frm_guide')
export class frm_guide extends frmbase {
    @property(Node)
    guide_node: Node = null!;
    @property(Node)
    guide_arrow: Node = null!;
    start() {
        Main.RegistEvent('GUIDE_SHOW', this.show_guide.bind(this));
    }
    show_guide(data: any) {
        //this.guide_node.setPosition(data.pos);
        //this.guide_arrow.setPosition(data.pos);
        this.show();

        return null;
    }

    update(deltaTime: number) {
        
    }
}


