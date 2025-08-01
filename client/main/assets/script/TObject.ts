import { _decorator, Color, Component, Node, Sprite, SpriteFrame } from 'cc';
import { gridcreator } from './gridcreator';
const { ccclass, property } = _decorator;

@ccclass('TObject')
export class TObject extends Component {

    @property(Sprite)
    public sel: Sprite = null!; 
    @property(Sprite)
    src: Sprite = null!;
    x: number = 0;
    y: number = 0;
    type: number = 0;
    
    private static obj: TObject | null = null;
    private creator: gridcreator | null = null;
    private ondestroy: boolean = false;
    private released: boolean = false;

    static get lastobj(): TObject | null {
        return this.obj;
    }

    static set lastobj(value: TObject | null) {
        if (this.obj !== value) {
            this.obj?.unSel();
            this.obj = value;
            this.obj?.Select();
        }
    }

    private Select(): void {
        if (this.sel) {
            this.sel.color = Color.BLUE;
            this.sel.node.active = true;
        }
    }

    private unSel(): void {
        if (this.ondestroy || !this.sel) {
            return;
        }
        this.sel.node.active = false;
    }
    start() {

    }
    SetSprite(i: number, j: number, _tp: number, xx: SpriteFrame, _creator: gridcreator): void {
        this.type = _tp;
        this.creator = _creator;
        this.x = i;
        this.y = j;
        this.src.spriteFrame = xx;
    }
    update(deltaTime: number) {
        
    }
}


