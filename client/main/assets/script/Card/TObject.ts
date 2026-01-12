
// 首先修改导入部分，添加tween
import { _decorator, Component, Node, Sprite,Animation,  UITransform, Vec2, instantiate, director, Prefab, math, Color, Vec3, SpriteFrame, Button, Director, tween, error } from 'cc';
import { gridcreator } from '../gridcreator';
        // 监听遮罩的触摸事件
import { EventTouch } from 'cc';
import { Main } from '../main';
import { LevelMgr, GameMode } from '../levelmgr';
import { frm_guide } from '../ui/frm_guide';
const { ccclass, property } = _decorator;

@ccclass('TObject')
export class TObject extends Component {
    GetTixing():TObject[] {
         if (!this.creator || !this.creator.node) {
            console.error("Tixing: creator or creator.node is null");
            return [];
        }
        
        let ret: TObject[] = [];
        // 遍历 creator 节点的所有子节点
        for (let i = 0; i < this.creator!.node.children.length; i++) {
            const tx = this.creator!.node.children[i];
            const _sel = tx.getComponent(TObject);
            if (_sel != null) {
                let pres: Vec2[] = [];
                // 调用连连看连接检查方法
                let c = gridcreator.CanConnect(this.x + 1, this.y + 1, _sel.x + 1, _sel.y + 1, pres);
                if (c) {
                     
                    if (pres.length > 0) {
                        const p = pres[pres.length - 1];
                        // 添加边界检查
                        if (p.x - 1 >= 0 && p.y - 1 >= 0) {
                            const node1 = this.creator!.node.getChildByName(`${p.x - 1},${p.y - 1}`);
                            if (node1) {
                                const tobj1 = node1.getComponent(TObject); 
                                ret.push(tobj1);
                                //tobj1.ShowTiXing();
                            }
                        }
                    }
                    
                    // 获取路径第一个点并高亮显示
                    if (pres.length > 0) {
                        const p2 = pres[0];
                        // 添加边界检查
                        if (p2.x - 1 >= 0 && p2.y - 1 >= 0) {
                            const node2 = this.creator!.node.getChildByName(`${p2.x - 1},${p2.y - 1}`);
                            if (node2) {
                                const tobj2 = node2.getComponent(TObject); 
                                ret.push(tobj2);
                                //tobj2.ShowTiXing();
                            }
                        }
                    }
                    break;
                }
            }
        }
        return ret;
    }
    public layer: number = 0;
    @property(Sprite)
    public mask: Sprite = null!;
    
    /**
     * 检查当前卡牌是否被盖住，并更新mask显示状态
     * 改进：检测上层卡牌四个角的位置，如果在当前卡牌矩形框内，则认为被遮挡
     */
    public updateMaskStatus(): void {
        // 检查是否为分层叠加模式
        if (!this.creator || !(this.creator as any).isLayerSplitMode) {
            return;
        }
        
        // 获取当前卡牌的世界坐标矩形
        const currentWorldRect = this.node.getComponent(UITransform)!.getBoundingBoxToWorld();
        // 当前矩形向左上角偏移20%像素
        //currentWorldRect.xMin -= currentWorldRect.width * 0.05;
        //currentWorldRect.yMin += currentWorldRect.height * 0.05;
        currentWorldRect.width *= 0.9;
        currentWorldRect.height *= 0.9;

        // 默认不被遮挡
        let isCovered = false;
        
        // 遍历所有卡牌，检查是否有上层卡牌遮挡当前卡牌
        for (let i = 0; i < this.creator!.node.children.length; i++) {
            const child = this.creator!.node.children[i];
            for(let j=0;j<child.children.length;j++){
                const cchild = child.children[j];
                const tobj = cchild.getComponent(TObject);
                if (tobj && !tobj.released && tobj !== this) {
                    // 检查是否为同一层或下层
                    if(tobj.layer <= this.layer){
                        continue;
                    }
                    
                    // 获取其他卡牌的世界坐标矩形
                    const otherWorldRect = tobj.node.getComponent(UITransform)!.getBoundingBoxToWorld();
                    
                    // 检查两个矩形是否相交
                    if (currentWorldRect.intersects(otherWorldRect)) {
                        // 存在重叠，当前卡牌被遮挡
                        isCovered = true;
                        break;
                    }
                }
            }
            if (isCovered) {
                break;
            }
        }
        
        // 更新mask显示状态
        if (this.mask) {
            this.mask.node.active = isCovered;
        }
    }
    
    /**
     * 隐藏模式
     * @param arg0 
     */
    private mode: boolean = false;
    SetHideMode(arg0: boolean) {
        this.mode = arg0;
        
        if (this.mode) {
            // 启用隐藏模式
            if (this.back) {
                // 一直保持back节点开启状态
                this.back.active = true;
                this.backNodeVisible = true;
                
                // 不设置自动关闭的定时器
                // 只有在Select方法中才会临时关闭
            }
        } else {
            // 禁用隐藏模式
            if (this.hideModeTimer) {
                clearTimeout(this.hideModeTimer);
                this.hideModeTimer = null;
            }
            
            // 显示back节点
            if (this.back) {
                this.back.active = true;
                this.backNodeVisible = true;
            }
        }
    }

    @property(Sprite)
    public sel: Sprite = null!; 
    @property(Sprite)
    src: Sprite = null!; 
    @property(Node)
    back: Node = null!; // 添加back节点属性
    x: number = 0;
    y: number = 0;
    type: number = 0;
    @property(SpriteFrame)
    public plane: SpriteFrame = null!;
    @property(SpriteFrame)
    public majiang: SpriteFrame = null!;
    public oldpos: Vec3 = new Vec3(); // 添加oldpos属性
    // 添加隐藏模式相关属性
    private hideModeTimer: any = null;
    private backNodeVisible: boolean = true;
    
    private static obj: TObject | null = null;
    private static firstClickReported: boolean = false;
    
    // 添加三消模式相关变量
    private static firstCard: TObject | null = null; // 第一个选中的卡牌
    private static secondCard: TObject | null = null; // 第二个选中的卡牌

    // 添加重置静态变量的方法
    public static resetStaticVariables(): void {
        TObject.firstClickReported = false;
        TObject.firstCard = null;
        TObject.secondCard = null;
        TObject.obj = null;
    }

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
    UseMaJiangBg(){
        this.node.getChildByName("bg").getComponent(Sprite)!.spriteFrame = this.majiang;
    }
    // 修改Select方法以支持隐藏模式
    private Select(showtime: number=1000): void {

        
        // 如果处于隐藏模式，选中时隐藏back节点
        if (this.mode && this.back) {
            // 清除之前的定时器
            if (this.hideModeTimer) {
                clearTimeout(this.hideModeTimer);
                this.hideModeTimer = null;
            }
            
            // 隐藏back节点
            this.back.active = false;
            this.backNodeVisible = false;
            
            // 1秒后重新显示back节点
            this.hideModeTimer = setTimeout(() => {
                if (this.back && this.mode) {
                    this.back.active = true;
                    this.backNodeVisible = true;
                }
            }, showtime);
        }
        else{
            if (this.sel) {
                this.sel.color = Color.WHITE;
                this.sel.node.active = true;
                this.node.setSiblingIndex(this.node.parent.children.length - 1);
            } 
        }
    }

    private unSel(): void {
        if (this.ondestroy || !this.sel) {
            return;
        }
        this.sel.node.active = false;
    } 
    ForceShow(): void {
        if (this.hideModeTimer) {
                clearTimeout(this.hideModeTimer);
                this.hideModeTimer = null;
        }
        if (this.back) {
            this.back.active = false;
            this.backNodeVisible = true;
        }
    }
    /**
     * 处理记忆模式点击事件
     */
    private handleMemoryMode(): void {
        // 如果这张卡牌已经被消除，不处理点击事件
        if (this.released) {
            return;
        }
        
        // 如果还没有选中任何卡牌，选中这张卡牌作为第一张
        if (TObject.firstCard === null) {
            TObject.firstCard = this;
            this.Select();
            return;
        }
        
        // 如果点击的是已经选中的第一张卡牌，取消选中
        if (TObject.firstCard === this) {
            TObject.firstCard = null;
            this.unSel();
            return;
        }
        
        // 检查两张卡牌的类型是否相同
        if (TObject.firstCard.type === this.type) {
            // 类型相同，执行消除逻辑
            const firstCard = TObject.firstCard;
            const secondCard = this;
            
            // 先选中第二张卡牌
            //secondCard.Select();
            
            // 关闭两张卡牌的back节点
            firstCard.ForceShow();
            secondCard.ForceShow();
      
             // 标记两张卡牌为已释放
            firstCard.released = true;
            secondCard.released = true;

            // 更新地图数据
            gridcreator.map[firstCard.x + 1][firstCard.y + 1] = 0;
            gridcreator.map[secondCard.x + 1][secondCard.y + 1] = 0;
            
                          
            // 重置选中状态
            TObject.firstCard = null;
            TObject.obj = null;
            
            // 1秒钟后执行PlayEffect方法
            setTimeout(() => {
               

                // 执行动画效果
                firstCard.PlayEffect(() => {
                    Main.DispEvent('event_zhengli');
                });
                secondCard.PlayEffect(() => {
                    Main.DispEvent('event_zhengli');
                });
                
                // 触发积分增加事件（记忆模式每次消除一对卡牌加1分）
                Main.DispEvent('event_add_jifen', 1);
            }, 1000);
        } else {
            // 类型不同，重新选择第一张卡牌
            TObject.firstCard.unSel();
            TObject.firstCard = this;
            this.Select();
        }
    }
    
    public HasConnect(): boolean {
        // 添加空值检查
        if (!this.creator || !this.creator.node || !gridcreator.map) {
            console.error("HasConnect: creator, creator.node or gridcreator.map is null");
            return false;
        }
        
        let ret = false;
        const children = this.creator.node.children;

        for (const child of children) {
            const _sel = child.getComponent(TObject);
            if (_sel) {
                const poslist: Vec2[] = [];
                // 添加边界检查
                if (this.x + 1 >= 0 && this.y + 1 >= 0 && 
                    this.x + 1 < gridcreator.map.length && 
                    this.y + 1 < gridcreator.map[this.x + 1].length) {
                    ret = gridcreator.CanConnect(this.x + 1, this.y + 1, _sel.x + 1, _sel.y + 1, poslist);
                    if (ret) break;
                }
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
                                                         (p.y - 1) * this.creator.gridsize ));
            let endPos = this.creator.tref.add(new Vec2((p2.x - 1) * this.creator.gridsize + this.creator.gridsize/2, 
                                                       (p2.y - 1) * this.creator.gridsize ));

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

        // 在销毁对象前显示加分提示
        if (this.creator && (this.creator as any).showScorePopup) {
            // 显示第一个卡牌的加分提示
            (this.creator as any).showScorePopup(self.node.position.clone());
            // 显示第二个卡牌的加分提示
            (this.creator as any).showScorePopup(gb.node.position.clone());
        }

        self.PlayEffect(()=>{
            Main.DispEvent('event_zhengli'); 
        });
        gb.PlayEffect(()=>{
            Main.DispEvent('event_zhengli'); 
        });

        // 销毁对象

        for (const line of lines) {
            line.destroy();
        }
    
        // 等待到下一帧确保节点被销毁
        await new Promise(resolve => setTimeout(resolve, 0));

        // 触发积分增加事件（连连看模式每次消除一对卡牌加1分）
        Main.DispEvent('event_add_jifen', 1);
        
        // 修复：在分层叠加模式下，需要正确更新地图数据
        if (this.creator && (this.creator as any).isLayerSplitMode) {
            // 在分层叠加模式下，需要移除顶层卡牌而不是整个位置
            const lastCell = gridcreator.map[gb.x + 1][gb.y + 1];
            const selfCell = gridcreator.map[self.x + 1][self.y + 1];
            
            if (Array.isArray(lastCell) && lastCell.length > 0) {
                lastCell.pop(); // 移除顶层卡牌
            }
            
            if (Array.isArray(selfCell) && selfCell.length > 0) {
                selfCell.pop(); // 移除顶层卡牌
            }
        } else {
            // 在普通模式下，清空整个位置
            gridcreator.map[gb.x + 1][gb.y + 1] = 0;
            gridcreator.map[self.x + 1][self.y + 1] = 0;
        }
        

    }
    

    PlayEffect(cb) {

  
// 播放动画
        let anim = this.node.getComponent(Animation);

        var node = this.node;
        // 监听动画结束，自动隐藏节点
        anim.on(Animation.EventType.FINISHED, () => {
            node.removeFromParent();
            node.destroy();
            cb(); 
        }, this);
        anim.play();
    }
    /**
     * 检查是否可以连接
     */
    private Check(last: TObject, _sel: TObject, poslist: Vec2[]): boolean {
        // 添加空值检查
        if (!last || !_sel || !gridcreator.map) {
            return false;
        }
        
        // 修复：在分层叠加模式下，需要检查卡牌是否在顶层
        if (this.creator && (this.creator as any).isLayerSplitMode) {
            // 在分层叠加模式下，需要检查卡牌是否在顶层才能被消除
            // 获取两个卡牌位置的地图数据
            const lastCell = gridcreator.map[last.x + 1][last.y + 1];
            const selCell = gridcreator.map[_sel.x + 1][_sel.y + 1];
            
            // 检查是否为数组类型（分层模式）
            if (Array.isArray(lastCell) && Array.isArray(selCell)) {
                // 检查卡牌是否在顶层
                if (lastCell.length === 0 || selCell.length === 0) {
                    return false;
                }
                
                const lastTopType = lastCell[lastCell.length - 1];
                const selTopType = selCell[selCell.length - 1];
                
                // 检查顶层卡牌类型是否相同
                if (lastTopType !== selTopType) {
                    return false;
                }
            } else {
                // 如果不是数组类型，使用原来的方法
                if (_sel.type !== last.type) return false;
            }
        } else {
            // 在普通模式下，直接比较类型
            if (_sel.type !== last.type) return false;
        }
        
        // 添加边界检查
        if (last.x + 1 < 0 || last.y + 1 < 0 || 
            last.x + 1 >= gridcreator.map.length || 
            last.y + 1 >= gridcreator.map[last.x + 1].length ||
            _sel.x + 1 < 0 || _sel.y + 1 < 0 || 
            _sel.x + 1 >= gridcreator.map.length || 
            _sel.y + 1 >= gridcreator.map[_sel.x + 1].length) {
            return false;
        }

        return gridcreator.CanConnect(last.x + 1, last.y + 1, _sel.x + 1, _sel.y + 1, poslist);
    }
    Tixing(): boolean {
        // 添加空值检查
        if (!this.creator || !this.creator.node) {
            console.error("Tixing: creator or creator.node is null");
            return false;
        }
        
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
                    if (pres.length > 0) {
                        const p = pres[pres.length - 1];
                        // 添加边界检查
                        if (p.x - 1 >= 0 && p.y - 1 >= 0) {
                            const node1 = this.creator!.node.getChildByName(`${p.x - 1},${p.y - 1}`);
                            if (node1) {
                                const tobj1 = node1.getComponent(TObject);
                                if (tobj1) {
                                    tobj1.ShowTiXing();
                                }
                            }
                        }
                    }
                    
                    // 获取路径第一个点并高亮显示
                    if (pres.length > 0) {
                        const p2 = pres[0];
                        // 添加边界检查
                        if (p2.x - 1 >= 0 && p2.y - 1 >= 0) {
                            const node2 = this.creator!.node.getChildByName(`${p2.x - 1},${p2.y - 1}`);
                            if (node2) {
                                const tobj2 = node2.getComponent(TObject);
                                if (tobj2) {
                                    tobj2.ShowTiXing();
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
        return ret;
    }
    private ShowTiXing()
    {
        this.sel.color = Color.GREEN;
        this.sel.node.active = true; 
    }
    start() {
        //响应鼠标点击事件
        this.getComponent(Button)!.node.on('click',this.onMaskTouch, this);

        //this.node.on('touchstart', this.onMaskTouch, this);
    }
    onMaskTouch() {
        if(frm_guide.isShow ){
            if(frm_guide.currCard != this){
                return;
            }
            frm_guide.state++; 
        }
        

        // 上报第一次碰撞事件（玩家开始玩了）
        if (!TObject.firstClickReported) {
            TObject.firstClickReported = true;
            // 使用Main.DispEvent触发埋点事件
            Main.DispEvent("event_peng");
        }
        
        // 在困难模式下增加点击误判率
        if (LevelMgr.gameMode === GameMode.HARD) {
            // 10%的概率忽略点击
            if (Math.random() < 0.1) {
                console.log("困难模式下点击被忽略");
                return;
            }
        }
        
        // 检查creator是否存在
        if (!this.creator) {
            console.error("TObject creator is null");
            return;
        }
        
        // 检查是否为记忆模式
        if (this.creator && (this.creator as any).gameType === 'mem') {
            // 记忆模式逻辑
            this.handleMemoryMode();
        } 
        // 检查是否为三消模式
        else if (this.creator && (this.creator as any).isSanxiaoMode) {
            // 三消模式逻辑
            this.handleSanxiaoMode();
        }
        // 检查是否为分层叠加模式
        else if (this.creator && (this.creator as any).isLayerSplitMode) {
            // 分层叠加模式逻辑
            // 检查卡牌是否已经被移动到容器中
            if (this.released) {
                console.log('卡牌已经被移动到容器中，无法再次点击');
                return;
            }
            // 检查mask是否存在且处于激活状态
            if (this.mask && this.mask.node.active) {
                // 卡牌被遮挡，不允许选中
                this.triggerScreenShake();
                return;
            }
              

         
            // 添加保护性检查，确保节点仍然有效
            if (this.node && this.node.isValid) {
               
                // 标记卡牌为已释放（已移动到容器中）
                this.released = true;
                
                // 直接将卡牌移动到容器中
                Main.DispEvent("event_move_to_container", this.node);
            } else {
                console.warn("试图移动无效的卡牌节点到容器中");
            }
        }
        // 检查是否为连连看模式
        else if (this.creator && (this.creator as any).isLianliankanMode) {
            // 连连看模式逻辑
            if (TObject.lastobj !== null) {
                const poslist: Vec2[] = [];
                if (this.Check(TObject.lastobj, this, poslist)) {
                    this.released = true;
                    const gb = TObject.lastobj;
                    gb.released = true;

                    // 更新地图数据
                    // 修复：在分层叠加模式下，需要正确更新地图数据
                    if (this.creator && (this.creator as any).isLayerSplitMode) {
                        // 在分层叠加模式下，需要移除顶层卡牌而不是整个位置
                        const lastCell = gridcreator.map[gb.x + 1][gb.y + 1];
                        const selfCell = gridcreator.map[this.x + 1][this.y + 1];
                        
                        if (Array.isArray(lastCell) && lastCell.length > 0) {
                            lastCell.pop(); // 移除顶层卡牌
                        }
                        
                        if (Array.isArray(selfCell) && selfCell.length > 0) {
                            selfCell.pop(); // 移除顶层卡牌
                        }
                    } else {
                        // 在普通模式下，清空整个位置
                        gridcreator.map[gb.x + 1][gb.y + 1] = 0;
                        gridcreator.map[this.x + 1][this.y + 1] = 0;
                    }

                    TObject.obj = null;

                    // 开始显示连线动画
                    Director.instance.getScheduler().schedule(() => {
                        this.showline(gb, this, poslist);
                    }, this, 0, 0, 0, false);
                } else {
                    // 两个卡牌相同但不能消除，触发震动效果
                    if (TObject.lastobj.type === this.type) {
                        this.triggerScreenShake();
                    }
                    TObject.lastobj = this;
                }
            } else {
                TObject.lastobj = this;
            }
        }
        else{
            console.error("No valid game mode found", this.creator);
        }
    }
    
    onLoad() {
        // 初始化隐藏模式相关属性
        this.hideModeTimer = null;
        this.backNodeVisible = true;
    }
    
    onDestroy() {
        // 清理隐藏模式定时器
        if (this.hideModeTimer) {
            clearTimeout(this.hideModeTimer);
            this.hideModeTimer = null;
        }
    }
    
    SetSprite(i: number, j: number, _tp: number, xx: SpriteFrame, _creator: gridcreator): void {
        this.type = _tp;
        this.creator = _creator;
        this.x = i;
        this.y = j;
        this.src.spriteFrame = xx;
        
        // 如果是分层叠加模式，添加特殊视觉效果
        if (_creator && (_creator as any).isLayerSplitMode) {
            // 可以在这里添加分层模式的特殊效果
            // 例如添加边框或特殊颜色来表示可点击状态
        }
        
        // 如果启用了隐藏模式，初始化back节点为开启状态
        if (this.mode && this.back) {
            this.back.active = true;
            this.backNodeVisible = true;
            
            // 清除之前的定时器
            if (this.hideModeTimer) {
                clearTimeout(this.hideModeTimer);
                this.hideModeTimer = null;
            }
        }
    }
    update(deltaTime: number) {
        
    }
    
    // 添加三消模式相关方法
    
    /**
     * 处理三消模式点击事件
     */
    private handleSanxiaoMode(): void {
        // 如果这张卡牌已经被消除，不处理点击事件
        if (this.released) {
            return;
        }
        
        // 如果还没有选中任何卡牌，选中这张卡牌作为第一张
        if (TObject.firstCard === null) {
            TObject.firstCard = this;
            this.Select();
            return;
        }
        
        // 如果点击的是已经选中的第一张卡牌，取消选中
        if (TObject.firstCard === this) {
            TObject.firstCard = null;
            this.unSel();
            return;
        }
        
        // 设置第二张卡牌
        TObject.secondCard = this;
        // 选中第二张卡牌
        this.Select();
        
        //延迟1秒
        this.scheduleOnce(async () => {
            // 检查两张卡牌是否仍然有效
            if (!TObject.firstCard || !TObject.secondCard) {
                console.warn("卡牌已被销毁，取消交换操作");
                return;
            }
            
            // 检查两张卡牌的节点是否仍然有效
            if (!TObject.firstCard.node || !TObject.secondCard.node) {
                console.warn("卡牌节点已被销毁，取消交换操作");
                TObject.firstCard = null;
                TObject.secondCard = null;
                return;
            }
            
            // 检查两张卡牌是否相邻
            if (this.areAdjacent(TObject.firstCard, TObject.secondCard)) {
                // 交换两张卡牌
                await this.swapCards(TObject.firstCard, TObject.secondCard);
            } else {
                // 不相邻，检查是否为相同类型
                if (TObject.firstCard.type === TObject.secondCard.type) {
                    // 相同类型但不相邻，触发全屏震动特效
                    this.triggerScreenShake();
                }
                
                // 重新选择第一张卡牌
                TObject.firstCard.unSel();
                TObject.firstCard = this;
                this.Select();
                TObject.secondCard = null;
                return;
            }
            
            // 重置选中状态
            if (TObject.firstCard) {
                TObject.firstCard.unSel();
                TObject.firstCard = null;
            }
            if (TObject.secondCard) {
                TObject.secondCard.unSel();
                TObject.secondCard = null;
            }
        }, 0.2);
       
    }
    
    
    /**
     * 检查两张卡牌是否相邻
     */
    private areAdjacent(card1: TObject, card2: TObject): boolean {
        // 相邻的定义：在同一行且列相差1，或在同一列且行相差1
        return (card1.x === card2.x && Math.abs(card1.y - card2.y) === 1) ||
               (card1.y === card2.y && Math.abs(card1.x - card2.x) === 1);
    }
    
    /**
     * 交换两张卡牌的位置和数据 - 添加位移动画
     */
    private async swapCards(card1: TObject, card2: TObject): Promise<void> {
        // 检查卡牌节点是否存在
        if (!card1.node || !card2.node) {
            console.error("无法交换卡牌：卡牌节点不存在");
            return;
        }
        
        // 保存原始位置和数据用于恢复
        const originalX1 = card1.x;
        const originalY1 = card1.y;
        const originalX2 = card2.x;
        const originalY2 = card2.y;
        const originalType1 = gridcreator.map[card1.x + 1][card1.y + 1];
        const originalType2 = gridcreator.map[card2.x + 1][card2.y + 1];
        
        // 交换地图数据
        const tempType = gridcreator.map[card1.x + 1][card1.y + 1];
        gridcreator.map[card1.x + 1][card1.y + 1] = gridcreator.map[card2.x + 1][card2.y + 1];
        gridcreator.map[card2.x + 1][card2.y + 1] = tempType;
        
        // 交换卡牌属性
        const tempX = card1.x;
        const tempY = card1.y;
        card1.x = card2.x;
        card1.y = card2.y;
        card2.x = tempX;
        card2.y = tempY;
        
        // 更新节点名称
        card1.node.name = `${card1.x},${card1.y}`;
        card2.node.name = `${card2.x},${card2.y}`;
        
        // 添加位移动画
        if (this.creator) {
            const pos1 = this.creator.tref.add(new Vec2((card1.x) * this.creator.gridsize, (card1.y) * this.creator.gridsize));
            const pos2 = this.creator.tref.add(new Vec2((card2.x) * this.creator.gridsize, (card2.y) * this.creator.gridsize));
            
            // 创建并等待位移动画完成
            await Promise.all([
                new Promise<void>((resolve) => {
                    tween(card1.node)
                        .to(0.2, { position: new Vec3(pos1.x, pos1.y) }, { easing: 'quadInOut' })
                        .call(() => resolve())
                        .start();
                }),
                new Promise<void>((resolve) => {
                    tween(card2.node)
                        .to(0.2, { position: new Vec3(pos2.x, pos2.y) }, { easing: 'quadInOut' })
                        .call(() => resolve())
                        .start();
                })
            ]);
        }
        
        // 检查是否有可消除的组合（只在三消模式下检查）
        if (this.creator && (this.creator as any).isSanxiaoMode) {
            const hasElimination = await this.creator.checkAndEliminateSanxiaoForCards([card1, card2]);
            
            // 如果没有消除，则恢复原始位置
            if (!hasElimination) {
                // 恢复地图数据
                gridcreator.map[originalX1 + 1][originalY1 + 1] = originalType1;
                gridcreator.map[originalX2 + 1][originalY2 + 1] = originalType2;
                
                // 恢复卡牌属性
                card1.x = originalX1;
                card1.y = originalY1;
                card2.x = originalX2;
                card2.y = originalY2;
                
                // 更新节点名称
                if (card1.node && card2.node) {
                    card1.node.name = `${card1.x},${card1.y}`;
                    card2.node.name = `${card2.x},${card2.y}`;
                }
                
                // 恢复位置，同样添加动画
                if (this.creator) {
                    const pos1 = this.creator.tref.add(new Vec2((card1.x) * this.creator.gridsize, (card1.y) * this.creator.gridsize));
                    const pos2 = this.creator.tref.add(new Vec2((card2.x) * this.creator.gridsize, (card2.y) * this.creator.gridsize));
                    
                    // 创建并等待恢复动画完成
                    await Promise.all([
                        new Promise<void>((resolve) => {
                            tween(card1.node)
                                .to(0.2, { position: new Vec3(pos1.x, pos1.y) }, { easing: 'quadInOut' })
                                .call(() => resolve())
                                .start();
                        }),
                        new Promise<void>((resolve) => {
                            tween(card2.node)
                                .to(0.2, { position: new Vec3(pos2.x, pos2.y) }, { easing: 'quadInOut' })
                                .call(() => resolve())
                                .start();
                        })
                    ]);
                }
            }
        }
        
        // 取消两张卡牌的选中状态
        card1.unSel();
        card2.unSel();
    }
    
    /**
     * 触发全屏震动特效
     */
    private triggerScreenShake(): void {
        // 获取grid节点
        const gridNode = this.creator?.node;
        if (!gridNode) {
            console.warn("无法找到grid节点，无法触发震动效果");
            return;
        }
        
        // 保存原始位置
        const originalPosition = gridNode.position.clone();
        
        // 停止之前的动画
        tween(gridNode).stop();
        
        // 创建简单的震动动画
        tween(gridNode)
            .by(0.05, { position: new Vec3(-3, 0, 0) }) // 向左偏移
            .by(0.1, { position: new Vec3(6, 0, 0) })   // 向右偏移
            .by(0.05, { position: new Vec3(-3, 0, 0) }) // 回到原位
            .call(() => {
                // 确保回到原始位置
                gridNode.setPosition(originalPosition);
            })
            .start();
    }
}
