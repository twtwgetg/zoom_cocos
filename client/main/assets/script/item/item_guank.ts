import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Sprite, UITransform } from 'cc';
import { LevelMgr } from "../levelmgr"
import { Main } from '../main';
const { ccclass, property } = _decorator;

@ccclass('item_guank')
export class item_guank extends Component {
    setLevel(level: number) {
        this.level = level;
        this.lbl_name.string = "关卡" + (level+1);
        let count = LevelMgr.getCount(level) ;
        for(let i = 0; i < count; i++) {
            var nx = instantiate(this.spr_ani);
            //nx.setPosition(i*20,0);
            this.trans_anis.addChild(nx);
            nx.getComponent(Sprite).spriteFrame = Main.DispEvent('event_getsprite',level+1+i);
        }
        this.trans_anis.getComponent(UITransform)!.setContentSize(count*64,64);
    }
    level: number = 1;
    @property(Node)
    trans_anis: Node = null!;
    @property(Label)
    lbl_name: Label = null!;
    @property(Prefab)
    spr_ani: Prefab = null!;
    
    @property(Button)
    btn_guank: Button = null!;
    start() {
        this.btn_guank.node.on(Button.EventType.CLICK,this.onClick,this);
    }
    onClick():void
    {
        Main.DispEvent('event_play',this.level); 
    }
    update(deltaTime: number) {
        
    }
}


