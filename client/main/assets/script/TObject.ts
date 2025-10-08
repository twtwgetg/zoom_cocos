
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

            // 计算起始点和结束点的世界坐标
            // 由于网格坐标是从1开始的，需要减1得到0基坐标
            // 然后根据tref计算实际位置，注意要加上gridsize/2来对齐到网格中心
            let startPos = this.creator.tref.add(new Vec2((p.x - 1) * this.creator.gridsize + this.creator.gridsize/2, 
                                                         (p.y - 1) * this.creator.gridsize + this.creator.gridsize/2));
            let endPos = this.creator.tref.add(new Vec2((p2.x - 1) * this.creator.gridsize + this.creator.gridsize/2, 
                                                       (p2.y - 1) * this.creator.gridsize + this.creator.gridsize/2));

            // 计算线段的中点作为节点位置
            let midPos = new Vec2((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2);
            l.setPosition(midPos.x, midPos.y);

            // 计算线段的长度
            const deltaX = endPos.x - startPos.x;
            const deltaY = endPos.y - startPos.y;
            const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 设置缩放，x轴为长度，y轴保持不变
            // 由于预制体的原始宽度是150，我们需要根据实际长度进行缩放
            const scaleX = length / 150;
            l.setScale(new Vec3(scaleX, 1, 1));
            
            // 计算旋转角度
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            l.angle = -angle;

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
    Tixing(): boolean {
        let ret = false;
        // 遍历 creator 节点的所有子节点
        for (let i = 0; i < this.creator!.node.children.length; i++) {
            const tx = this.creator!.node.children[i];
            const _sel = tx.getComponent(TObject);
            if (_sel != null) {
                let pres: Vec2[] = [];
                // 调用连连看连接检查方法
                ret = gridcreator.CanConnect(this.x + 1, this.y + 1, _sel.x + 1, _sel.y + 1, pres);
                if (ret) {
                    // 获取路径最后一个点并高亮显示
                    const p = pres[pres.length - 1];
                    const node1 = this.creator!.node.getChildByName(`${p.x - 1},${p.y - 1}`);
                    if (node1) {
                        node1.getComponent(TObject)!.ShowTiXing();
                    }
                    
                    // 获取路径第一个点并高亮显示
                    const p2 = pres[0];
                    const node2 = this.creator!.node.getChildByName(`${p2.x - 1},${p2.y - 1}`);
                    if (node2) {
                        node2.getComponent(TObject)!.ShowTiXing();
                    }
                    break;
                }
            }
        }
        return ret;
    }
    private ShowTiXing()
    {
        this.sel.color = Color.RED;
        this.sel.node.active = true; 
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


