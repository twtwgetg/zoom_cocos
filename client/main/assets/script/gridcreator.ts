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

    private gameOver: boolean = false; // 游戏结束标志

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
            this.gameOver = true;
            this.initFruzon(); // 正确清除冷却状态和定时器
            return null;
        })
        Main.RegistEvent('game_win', (x)=>{
            this.clear();
            this.gameOver = true;
            this.initFruzon(); // 正确清除冷却状态和定时器
            return null;
        })

        Main.RegistEvent('event_brush', (x)=>{
            this.brushkind();
            return null;
        });
        let that =this;
        Main.RegistEvent('event_zhengli', async ()=>{

            //如果游戏结束了，那么就不执行
            if(this.gameOver) 
                return null;

             // 整理卡片
            that.zhengli();
            that.checkLeft();

            if (that.node.children.length === 0) {
                frm_main.isPause = true;

                // 等待0.5秒
                await new Promise(resolve => setTimeout(resolve, 500));

                // 检查是否为无限模式
                if (this.isInfiniteMode) {
                    // 无限模式下触发无限模式胜利事件
                    Main.DispEvent('game_win_infinite');
                } else {
                    // 普通模式下触发普通胜利事件
                    Main.DispEvent('game_win',LevelMgr.level);
                }
            }
        });

        Main.RegistEvent('event_play', () => { 
            //重新开始，那么删除之前的定时器，防止重复触发
            this.gameOver = false; // 重置游戏结束标志
            this.initFruzon();
        }); 
        Main.RegistEvent('event_resettime',(x)=>{
                        // Clear existing timeout if any
            console.log('开始时间冷却，持续时间根据关卡难度调整');
            this.initFruzon();
            Main.DispEvent('event_fruszon',true);
            
            // 根据关卡难度调整冷却时间
            const cooldownTime = LevelMgr.getToolCooldown(LevelMgr.level);
            console.log(`当前关卡: ${LevelMgr.level + 1}, 冷却时间: ${cooldownTime / 1000}秒`);
            
            this.resetTimeoutId = setTimeout(()=>{
                console.log('时间冷却结束');
                Main.DispEvent('event_fruszon',false);
                this.resetTimeoutId = null;
            }, cooldownTime);
            console.log('冷却定时器ID:', this.resetTimeoutId);
        });
        Main.RegistEvent('event_isfruszon', () => { 
            const isCooling = this.resetTimeoutId !== null;
            console.log('检查冷却状态:', isCooling, '定时器ID:', this.resetTimeoutId);
            return isCooling;
        });
    }
    initFruzon(){
        if (this.resetTimeoutId) {
            console.log('清除之前的冷却定时器:', this.resetTimeoutId);
            clearTimeout(this.resetTimeoutId);
            this.resetTimeoutId = null;
            Main.DispEvent('event_fruszon',false);
        }
        console.log('冷却状态已重置');
    }
    resetTimeoutId: any=null;
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
                // 降低触发自动刷新的阈值，从原来的2个卡牌减少到1个卡牌
                // 这样即使只剩下很少的卡牌也会触发刷新，让玩家更快接触到新动物
                if (xs.length > 1) {
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
        this.gameOver = false;
        // 确保重置无限模式标志，这是修复卡牌布局偏左问题的关键
        this.isInfiniteMode = false;
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
        // 确保新关卡中几乎全部是新卡牌，避免全是上一关的卡牌
        const cardTypes: number[] = [];
        
        // 确保至少95%的卡牌是新的（基于当前关卡）
        const newCardPairs = Math.ceil(totalPairs * 0.95);
        const oldCardPairs = totalPairs - newCardPairs;
        
        // 生成新的卡牌类型（基于当前关卡）
        for (let i = 0; i < newCardPairs; i++) {
            const type = Math.floor(Math.random() * count) + (level_playing + 1);
            cardTypes.push(type);
            cardTypes.push(type); // 成对添加
        }
        
        // 几乎不会添加旧的卡牌类型
        for (let i = 0; i < oldCardPairs; i++) {
            let type: number;
            // 只有在极其特殊的情况下（1%概率）并且关卡数足够大时才使用之前关卡的卡牌
            if (level_playing > 5 && Math.random() < 0.01) {
                // 从之前的关卡中选择卡牌类型，选择较近的关卡
                const previousLevel = level_playing - Math.floor(Math.random() * Math.min(2, level_playing - 5)) - 1;
                const previousCount = LevelMgr.getCount(previousLevel);
                type = Math.floor(Math.random() * previousCount) + (previousLevel + 1);
            } else {
                // 几乎总是使用当前关卡的卡牌类型
                type = Math.floor(Math.random() * count) + (level_playing + 1);
            }
            cardTypes.push(type);
            cardTypes.push(type); // 成对添加
        }
        
        // 打乱卡牌类型数组
        this.Shuffle(cardTypes);
        
        // 生成卡片对
        for (let p = 0; p < totalPairs; p++) {
            const type = cardTypes[p * 2]; // 获取卡牌类型
            
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
        // 在无限模式下不需要整理功能
        if (this.isInfiniteMode) {
            return;
        }
        
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
        const width = this.isInfiniteMode ? this.infiniteWid : this.wid;
        const height = this.isInfiniteMode ? this.infiniteHei : this.hei;
        const refx = (rect.width - width * this.gridsize) / 2;
        const refy = (rect.height - height * this.gridsize) / 2;
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

        // 清空所有卡牌上的提醒标志
        for (const card of remainingCards) {
            card.unSel(); // 清除选中状态和提醒标志
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
        // 用于存储找到的路径
        const paths: Vec2[][] = [];
        
        // 转弯点1: (x1, y2)
        if (gridcreator.map[x1][y2] === 0 && gridcreator.IsDirectlyConnected(x1, y1, x1, y2) && gridcreator.IsDirectlyConnected(x1, y2, x2, y2)) {
            const path: Vec2[] = [];
            path.push(new Vec2(x1, y1));
            path.push(new Vec2(x1, y2));
            path.push(new Vec2(x2, y2));
            paths.push(path);
        }

        // 转弯点2: (x2, y1)
        if (gridcreator.map[x2][y1] === 0 && gridcreator.IsDirectlyConnected(x1, y1, x2, y1) && gridcreator.IsDirectlyConnected(x2, y1, x2, y2)) {
            const path: Vec2[] = [];
            path.push(new Vec2(x1, y1));
            path.push(new Vec2(x2, y1));
            path.push(new Vec2(x2, y2));
            paths.push(path);
        }
        
        // 如果找到了路径，选择最短的路径
        if (paths.length > 0) {
            // 计算每条路径的长度并选择最短的
            let shortestPath = paths[0];
            let shortestLength = Infinity;
            
            for (const path of paths) {
                // 计算路径长度（曼哈顿距离）
                let pathLength = 0;
                for (let k = 0; k < path.length - 1; k++) {
                    pathLength += Math.abs(path[k].x - path[k+1].x) + Math.abs(path[k].y - path[k+1].y);
                }
                
                if (pathLength < shortestLength) {
                    shortestLength = pathLength;
                    shortestPath = path;
                }
            }
            
            // 将最短路径复制到poslist中
            poslist.splice(0, poslist.length, ...shortestPath);
            return true;
        }

        return false;
    }

    // 检查两个转弯连接
    private static IsConnectedWithTwoTurns(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        const rows = gridcreator.map.length;
        const cols = gridcreator.map[0].length;

        // 用于存储最短路径
        let shortestPath: Vec2[] | null = null;
        let shortestLength = Infinity;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (gridcreator.map[i][j] === 0) {
                    // 检查(x1,y1)到(i,j)再到(x2,y2)是否连通
                    const tempList: Vec2[] = [];
                    if (gridcreator.IsDirectlyConnected(x1, y1, i, j) && gridcreator.IsConnectedWithOneTurn(i, j, x2, y2, tempList)) {
                        // 构造完整路径
                        const fullPath: Vec2[] = [];
                        fullPath.push(new Vec2(x1, y1));
                        fullPath.push(new Vec2(i, j));
                        fullPath.push(...tempList.slice(1)); // 去掉重复的第一个点
                        
                        // 计算路径长度（曼哈顿距离）
                        let pathLength = 0;
                        for (let k = 0; k < fullPath.length - 1; k++) {
                            pathLength += Math.abs(fullPath[k].x - fullPath[k+1].x) + Math.abs(fullPath[k].y - fullPath[k+1].y);
                        }
                        
                        // 更新最短路径
                        if (pathLength < shortestLength) {
                            shortestLength = pathLength;
                            shortestPath = fullPath;
                        }
                    }
                }
            }
        }
        
        // 如果找到了路径，将其复制到poslist中
        if (shortestPath !== null) {
            poslist.splice(0, poslist.length, ...shortestPath);
            return true;
        }
        
        return false;
    }

    // 添加无限模式相关变量
    private isInfiniteMode: boolean = false;
    private infiniteWid: number = 10;
    private infiniteHei: number = 10;
    
    // 创建无限模式关卡
    CreateInfiniteMode(width: number, height: number) {
        this.gameOver = false;
        // 确保设置无限模式标志
        this.isInfiniteMode = true;
        this.infiniteWid = width;
        this.infiniteHei = height;

        // 清空TObject
        // TObject.clear();

        // 清空节点
        this.clear();

        // 初始化地图
        gridcreator.map = [];
        for (let i = 0; i < this.infiniteWid + 2; i++) {
            gridcreator.map[i] = [];
            for (let j = 0; j < this.infiniteHei + 2; j++) {
                gridcreator.map[i][j] = 0;
            }
        }

        // 计算网格大小
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.infiniteWid;
        const cellHeight = availableHeight / this.infiniteHei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);

        // 计算总格子数和对数
        const totalCells = this.infiniteWid * this.infiniteHei;
        const totalPairs = Math.floor(totalCells / 2); // 一半填充

        // 获取可用类型数量
        this.pl = this.plSprites;
        const availableTypes = this.pl.length - 1;
        if (availableTypes < 2) {
            console.error('图片类型不足，至少需要2个');
            return;
        }

        // 生成所有位置
        const positions: Vec2[] = [];
        for (let i = 0; i < this.infiniteWid; i++) {
            for (let j = 0; j < this.infiniteHei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }

        // 打乱位置
        this.Shuffle(positions);

        // 只填充一半的位置
        const fillCount = Math.floor(totalPairs / 2);
        
        // 生成卡片对
        for (let p = 0; p < fillCount; p++) {
            // 随机类型
            const type = Math.floor(Math.random() * availableTypes) + 1;

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
    
        console.log(`无限模式创建完成，网格大小: ${this.infiniteWid}x${this.infiniteHei}，已填充 ${fillCount * 2} 张卡片`);
    }
    
    // 生成新卡牌对（用于无限模式）
    // 返回true表示网格已满无法生成更多卡牌
    generateNewPair(): boolean {
        // 检查是否为无限模式
        if (!this.isInfiniteMode) {
            return false;
        }
        
        // 查找所有空位置
        const emptyPositions: Vec2[] = [];
        for (let x = 1; x <= this.infiniteWid; x++) {
            for (let y = 1; y <= this.infiniteHei; y++) {
                if (gridcreator.map[x][y] === 0) {
                    emptyPositions.push(new Vec2(x, y));
                }
            }
        }
        
        // 如果空位置少于2个，说明网格已满
        if (emptyPositions.length < 2) {
            console.log('网格已满，无法生成新卡牌对');
            return true;
        }
        
        // 随机选择两个空位置
        this.Shuffle(emptyPositions);
        const pos1 = emptyPositions[0];
        const pos2 = emptyPositions[1];
        
        // 随机选择卡牌类型
        const availableTypes = this.pl.length - 1;
        if (availableTypes < 1) {
            console.error('没有可用的卡牌类型');
            return false;
        }
        
        const type = Math.floor(Math.random() * availableTypes) + 1;
        
        // 更新地图
        gridcreator.map[pos1.x][pos1.y] = type;
        gridcreator.map[pos2.x][pos2.y] = type;
        
        // 生成卡片
        this.SpawnCard(pos1, type);
        this.SpawnCard(pos2, type);
        
        console.log(`生成新卡牌对，类型: ${type}，位置: (${pos1.x},${pos1.y}) 和 (${pos2.x},${pos2.y})`);
        
        // 检查是否已满
        return emptyPositions.length === 2; // 如果之前只有2个空位置，现在已满
    }
}