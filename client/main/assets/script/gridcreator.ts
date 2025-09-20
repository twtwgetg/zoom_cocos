import { _decorator, Component, Node, Sprite, UITransform, Vec2, instantiate, director, Prefab, math } from 'cc';
import { Main } from './main';
import { LevelMgr } from './levelmgr';
import { frm_main } from './frm_main';
const { ccclass, property } = _decorator;

 
@ccclass('gridcreator')
export class gridcreator extends Component {
    @property
    wid: number = 5;
    @property
    hei: number = 10;
    @property(Prefab)
    item: Prefab = null!;
    @property(Node)
    container: Node = null!;

    @property(Prefab)
    item_line: Prefab = null!;
    public static map: number[][] = [];
    public gridsize: number = 100;
    private level_cur: number = 0;
    private pl: Sprite[] = [];

    onLoad() {
        // 注册事件
        this.registEvents();
    }

    private registEvents() {
        // 这里假设Main是一个全局的事件管理类，在Cocos中可以使用director或自定义事件管理器
        
        Main.RegistEvent('event_tixing',(x)=>{
            const children = this.node.children;
            for (const child of children) {
                const p = child.getComponent('TObject') as any;
                if (!p) continue;

                if (p.Tixing()) {
                    break;
                }
            }
        });

        Main.RegistEvent('game_lose', (x)=>{
            this.clear();
            return null;
        })
        Main.RegistEvent('game_win', (x)=>{
            this.clear();
            return null;
        })

        Main.RegistEvent('event_brush', (x)=>{
            this.brushkind();
            return null;
        });
        let that =this;
        Main.RegistEvent('event_zhengli', async ()=>{
             // 整理卡片
            that.zhengli();
            that.checkLeft();

            if (that.node.children.length === 0) {
                frm_main.isPause = true;

                // 等待0.5秒
                await new Promise(resolve => setTimeout(resolve, 500));

                // 触发游戏胜利事件
                Main.DispEvent('game_win',LevelMgr.level);
            }
        });

        Main.RegistEvent('event_play', () => { 
            //重新开始，那么删除之前的定时器，防止重复触发
            this.initFruzon();
        }); 
        Main.RegistEvent('event_resettime',(x)=>{
                        // Clear existing timeout if any
            this.initFruzon();
            Main.DispEvent('event_fruszon',true);
            this.resetTimeoutId = setTimeout(()=>{
                Main.DispEvent('event_fruszon',false);
                this.resetTimeoutId = null;
            },15000);
        });
    }
    initFruzon(){
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
            Main.DispEvent('event_fruszon',false);
        }
    }
    resetTimeoutId: any;
    checkLeft() {
        let hasconnect = false;
        let trytimes = 10;

        while (!hasconnect && trytimes > 0) {
            trytimes--;
            const children = this.node.children;

            for (const child of children) {
                const p = child.getComponent('TObject') as any;
                if (p && p.HasConnect()) {
                    hasconnect = true;
                    break;
                }
            }

            if (!hasconnect) {
                const xs = this.node.getComponentsInChildren('TObject') as any[];
                if (xs.length > 2) {
                    console.log('没有连接，刷新');
                    this.brushkind();
                }
            }
        }
    }
 
    get plSprites(): Sprite[] {
        // 这里需要适配Cocos的资源获取方式
        // 假设Main.DispEvent是一个全局事件分发函数
        return Main.DispEvent('EVENT_GETPLSPRITES');// (director.emit('EVENT_GETRES') as unknown) as Sprite[];
    } 

    clear(){
        this.node.removeAllChildren();
    }
    Create(level_playing: number) {
        this.level_cur = level_playing;

        // 清空TObject（需要根据实际实现调整）
        // TObject.clear();

        // 获取关卡宽高（需要实现levelmgr）
        this.wid = LevelMgr.getWid(level_playing);
        this.hei = LevelMgr.getHei(level_playing);

        // 清空节点
        this.clear();

        // 初始化地图
        gridcreator.map = [];
        for (let i = 0; i < this.wid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.hei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }

        // 计算网格大小
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.wid;
        const cellHeight = availableHeight / this.hei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);

        // 计算总格子数和对数
        const totalCells = this.wid * this.hei;
        const totalPairs = totalCells / 2;

        // 获取可用类型数量
        this.pl = this.plSprites;
        const availableTypes = this.pl.length - 1;
        if (availableTypes < 2) {
            console.error('图片类型不足，至少需要2个');
            return;
        }

        // 生成所有位置
        const positions: Vec2[] = [];
        for (let i = 0; i < this.wid; i++) {
            for (let j = 0; j < this.hei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }

        // 打乱位置
        this.Shuffle(positions);

        // 获取关卡计数（需要实现levelmgr）
        const count = LevelMgr.getCount(level_playing);
        

        // 生成卡片对
        for (let p = 0; p < totalPairs; p++) {
            // 随机类型（需要根据实际level_playing调整）
            const type = Math.floor(Math.random() * count) + (level_playing+1);
            //const type = Math.floor(Math.random() * 5) + 1; // 临时值

            // 获取两个位置
            const pos1 = positions[p * 2];
            const pos2 = positions[p * 2 + 1];

            // 更新地图
            gridcreator.map[pos1.x][pos1.y] = type;
            gridcreator.map[pos2.x][pos2.y] = type;

            // 生成卡片
            this.SpawnCard(pos1, type);
            this.SpawnCard(pos2, type);
        }
    }

    // 整理剩余卡片位置
    public zhengli():void {
        // 根据关卡类型整理
        switch (this.level_cur % 8) {
            case 1:
                break;
            case 2:
                this.xiangxia();
                break;
            case 3:
                this.xiangshang();
                break;
            case 4:
                this.toleft();
                break;
            case 5:
                this.toright();
                break;
            case 6:
                this.tocentx();
                break;
            case 7:
                this.tocentery();
                break;
            default:
                break;
        }

        // 更新卡片位置
        this.UpdateCardPositions();
    }

    private tocentery() {
        const centerY = (this.hei + 1) / 2;

        for (let x = 1; x <= this.wid; x++) {
            // 向上整理
            for (let y = Math.floor(centerY); y > 0; y--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let bottomy = y; bottomy > 0; bottomy--) {
                        if (gridcreator.map[x][bottomy] !== 0) {
                            this.MoveCard(x, bottomy, x, y);
                            break;
                        }
                    }
                }
            }

            // 向下整理
            for (let y = Math.floor(centerY); y <= this.hei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let topy = y; topy <= this.hei; topy++) {
                        if (gridcreator.map[x][topy] !== 0) {
                            this.MoveCard(x, topy, x, y);
                            break;
                        }
                    }
                }
            }
        }

        this.UpdateCardPositions();
    }

    private tocentx() {
        const centerX = (this.wid + 1) / 2;

        for (let y = 1; y <= this.hei; y++) {
            // 向左整理
            for (let x = Math.floor(centerX); x > 0; x--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x; leftX > 0; leftX--) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }

            // 向右整理
            for (let x = Math.floor(centerX); x <= this.wid; x++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x; leftX <= this.wid; leftX++) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }

        this.UpdateCardPositions();
    }

    private toright() {
        for (let y = 1; y <= this.hei; y++) {
            for (let x = this.wid; x >= 1; x--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let leftX = x - 1; leftX >= 1; leftX--) {
                        if (gridcreator.map[leftX][y] !== 0) {
                            this.MoveCard(leftX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private MoveCard(fromX: number, fromY: number, toX: number, toY: number) {
        // 更新地图数据
        gridcreator.map[toX][toY] = gridcreator.map[fromX][fromY];
        gridcreator.map[fromX][fromY] = 0;

        // 更新卡片位置信息
        const card = this.FindCardAt(fromX - 1, fromY - 1);
        if (card) {
            card.x = toX - 1;
            card.y = toY - 1;
            card.node.name = `${card.x},${card.y}`;
        }
    }

    private toleft() {
        for (let y = 1; y <= this.hei; y++) {
            for (let x = 1; x <= this.wid; x++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let rightX = x + 1; rightX <= this.wid; rightX++) {
                        if (gridcreator.map[rightX][y] !== 0) {
                            this.MoveCard(rightX, y, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private xiangshang() {
        for (let x = 1; x <= this.wid; x++) {
            for (let y = this.hei; y >= 1; y--) {
                if (gridcreator.map[x][y] === 0) {
                    for (let downY = y - 1; downY >= 1; downY--) {
                        if (gridcreator.map[x][downY] !== 0) {
                            this.MoveCard(x, downY, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private xiangxia() {
        for (let x = 1; x <= this.wid; x++) {
            for (let y = 1; y <= this.hei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    for (let upY = y + 1; upY <= this.hei; upY++) {
                        if (gridcreator.map[x][upY] !== 0) {
                            this.MoveCard(x, upY, x, y);
                            break;
                        }
                    }
                }
            }
        }
    }

    private FindCardAt(x: number, y: number): any {
        const children = this.node.children;
        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            if (tobj && tobj.x === x && tobj.y === y) {
                return tobj;
            }
        }
        return null;
    }

    private UpdateCardPositions() {
        const children = this.node.children;
        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;      
            let pos =this.tref.add(new Vec2((tobj.x ) * this.gridsize, (tobj.y ) * this.gridsize)); 
            child.setPosition(pos.x, pos.y);
        }
    }

    get tref(): Vec2 {
        const rect = this.node.getComponent(UITransform);
        const refx = (rect.width - this.wid * this.gridsize) / 2;
        const refy = (rect.height - this.hei * this.gridsize) / 2;
        return new Vec2(refx-rect.width/2, refy-rect.height/2);
    }

    private MoveCardNode(cx: Node, mapPos: Vec2) {
        const rect = cx.getComponent(UITransform)!;
        cx.name = `${mapPos.x - 1},${mapPos.y - 1}`;

        rect.setContentSize(this.gridsize, this.gridsize);
        let pos =this.tref.add(new Vec2((mapPos.x - 1) * this.gridsize, (mapPos.y - 1) * this.gridsize)); 
        rect.anchorPoint = new Vec2(0,0);// 
        //设置rect的位置
        cx.setPosition(pos.x, pos.y); 
    }

    private SpawnCard(mapPos: Vec2, type: number) {
        const cx = instantiate(this.item);
        this.node.addChild(cx);
 

        this.MoveCardNode(cx, mapPos);

        // 设置精灵
        const xx = this.pl[type];
        const tobj = cx.getComponent('TObject') as any;
        tobj?.SetSprite(mapPos.x - 1, mapPos.y - 1, type, xx, this);
    }

    private Shuffle<T>(list: T[]): void {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
    }

    public brushkind() {
        // 收集所有剩余的TObject实例
        const remainingCards: any[] = [];
        const children = this.node.children;

        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            remainingCards.push(tobj);
        }

        // 检查数量是否为偶数
        const count = remainingCards.length;
        if (count % 2 !== 0) {
            console.warn('剩余卡片数量不是偶数，无法完全配对');
            return;
        }

        // 生成新类型列表
        const newTypes: number[] = [];
        for (let i = 0; i < remainingCards.length; i++) {
            newTypes.push(remainingCards[i].type);
        }

        // 打乱类型列表
        this.Shuffle(newTypes);

        // 应用新类型
        for (let i = 0; i < remainingCards.length; i++) {
            const card = remainingCards[i];
            const newType = newTypes[i];

            // 更新地图数据
            const mapPos = new Vec2(card.x + 1, card.y + 1);
            gridcreator.map[mapPos.x][mapPos.y] = newType;

            // 更新卡片显示
            if (newType < this.pl.length) {
                card.SetSprite(card.x, card.y, newType, this.pl[newType], this);
            } else {
                console.error(`err type ${newType}`);
            }
        }

        console.log(`已刷新 ${count} 张卡片的类型`);
    }

    // 检查两个卡片是否可以连接
    public static CanConnect(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        if (x1 === x2 && y1 === y2) {
            return false;
        }

        if (!gridcreator.map) {
            return false;
        }

        // 检查类型是否相同且不为空
        if (gridcreator.map[x1][y1] <= 0 || gridcreator.map[x2][y2] <= 0 || gridcreator.map[x1][y1] !== gridcreator.map[x2][y2]) {
            return false;
        }

        // 检查直接连接
        if (gridcreator.IsDirectlyConnected(x1, y1, x2, y2)) {
            poslist.push(new Vec2(x1, y1));
            poslist.push(new Vec2(x2, y2));
            return true;
        }

        // 检查一个转弯
        if (gridcreator.IsConnectedWithOneTurn(x1, y1, x2, y2, poslist)) {
            return true;
        }

        // 检查两个转弯
        if (gridcreator.IsConnectedWithTwoTurns(x1, y1, x2, y2, poslist)) {
            return true;
        }

        return false;
    }

    // 检查是否直接连接
    private static IsDirectlyConnected(x1: number, y1: number, x2: number, y2: number): boolean {
        // 水平连接
        if (x1 === x2) {
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY + 1; y < endY; y++) {
                if (gridcreator.map[x1][y] !== 0) {
                    return false;
                }
            }
            return true;
        }

        // 垂直连接
        if (y1 === y2) {
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);
            for (let x = startX + 1; x < endX; x++) {
                if (gridcreator.map[x][y1] !== 0) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    // 检查一个转弯连接
    private static IsConnectedWithOneTurn(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        // 转弯点1: (x1, y2)
        if (gridcreator.map[x1][y2] === 0 && gridcreator.IsDirectlyConnected(x1, y1, x1, y2) && gridcreator.IsDirectlyConnected(x1, y2, x2, y2)) {
            poslist.push(new Vec2(x1, y1));
            poslist.push(new Vec2(x1, y2));
            poslist.push(new Vec2(x2, y2));
            return true;
        }

        // 转弯点2: (x2, y1)
        if (gridcreator.map[x2][y1] === 0 && gridcreator.IsDirectlyConnected(x1, y1, x2, y1) && gridcreator.IsDirectlyConnected(x2, y1, x2, y2)) {
            poslist.push(new Vec2(x1, y1));
            poslist.push(new Vec2(x2, y1));
            poslist.push(new Vec2(x2, y2));
            return true;
        }

        return false;
    }

    // 检查两个转弯连接
    private static IsConnectedWithTwoTurns(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        const rows = gridcreator.map.length;
        const cols = gridcreator.map[0].length;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (gridcreator.map[i][j] === 0) {
                    // 检查(x1,y1)到(i,j)再到(x2,y2)是否连通
                    const tempList: Vec2[] = [];
                    if (gridcreator.IsDirectlyConnected(x1, y1, i, j) && gridcreator.IsConnectedWithOneTurn(i, j, x2, y2, tempList)) {
                        poslist.push(new Vec2(x1, y1));
                        poslist.push(...tempList);
                        return true;
                    }
                }
            }
        }
        return false;
    }
}