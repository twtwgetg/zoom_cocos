
import { _decorator, Component, Node, Sprite, UITransform, Vec2, instantiate, director, Prefab, math, Color, Vec3, SpriteFrame, Button, Director } from 'cc';
import { gridcreator } from './gridcreator';
import { Main } from './main';
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
    onButtonClick():void { 
        
        if (TObject.lastobj !== null) {
            const poslist: Vec2[] = [];
            if (this.Check(TObject.lastobj, this, poslist)) {
                this.released = true;
                const gb = TObject.lastobj;
                gb.released = true;

                // 更新地图数据
                gridcreator.map[gb.x + 1][gb.y + 1] = 0;
                gridcreator.map[this.x + 1][this.y + 1] = 0;

                TObject.obj = null;

                // 开始显示连线动画
                Director.instance.getScheduler().schedule(() => {
                    this.showline(gb, this, poslist);
                }, this, 0, 0, 0, false);
            } else {
                TObject.lastobj = this;
            }
        } else {
            TObject.lastobj = this;
        }
    }
    public HasConnect(): boolean {
        let ret = false;
        const children = this.creator.node.children;

        for (const child of children) {
            const _sel = child.getComponent(TObject);
            if (_sel) {
                const poslist: Vec2[] = [];
                ret = gridcreator.CanConnect(this.x + 1, this.y + 1, _sel.x + 1, _sel.y + 1, poslist);
                if (ret) break;
            }
        }
        return ret;
    }
    private async showline(gb: TObject, self: TObject, poslist: Vec2[]) {
        const lines: Node[] = [];
        self.Select();
        gb.Select();

        for (let i = 0; i < poslist.length - 1; i++) {
            const p = poslist[i];
            const p2 = poslist[i + 1];

            const l = instantiate(this.creator.item_line);
            this.creator.container.addChild(l); 

            let sc =new Vec2(p.x,p.y);// = p;

            let pos = this.creator.tref.add(sc.multiplyScalar(this.creator.gridsize)).subtract(new Vec2(this.creator.gridsize / 2, this.creator.gridsize / 2));
            l.setPosition(pos.x,pos.y); // 设置位置= pos; // 设置位置

            //rect.contentSize = new Vec2(this.creator.gridsize, this.creator.gridsize);

            const xdiff = p2.x - p.x;
            const ydiff = p2.y - p.y;

            l.setScale(new Vec3(xdiff !== 0 ? xdiff : 0.1, ydiff !== 0 ? ydiff : 0.1, 1));
            lines.push(l);
        }

        // 等待0.35秒
        await new Promise(resolve => setTimeout(resolve, 350));

        // 触发连线事件
        Main.DispEvent('event_lian');

        // 销毁对象
        self.node.removeFromParent();
        self.node.destroy();
        gb.node.removeFromParent();
        gb.node.destroy();

        for (const line of lines) {
            line.destroy();
        }
    
        // 等待到下一帧确保节点被销毁
        await new Promise(resolve => setTimeout(resolve, 0));
        Main.DispEvent('event_zhengli'); 
    }
    /**
     * 检查是否可以连接
     */
    private Check(last: TObject, _sel: TObject, poslist: Vec2[]): boolean {
        if (_sel.type !== last.type) return false;

        return gridcreator.CanConnect(last.x + 1, last.y + 1, _sel.x + 1, _sel.y + 1, poslist);
    }

    start() {
        //响应鼠标点击事件
        this.getComponent(Button)!.node.on('click',this.onButtonClick, this);
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


