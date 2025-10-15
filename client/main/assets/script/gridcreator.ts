import { _decorator, Component, Node, Sprite, UITransform, Vec2, instantiate, director, Prefab, math, Vec3, tween, Label, Color } from 'cc';
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

    // 添加三消模式相关变量
    private isSanxiaoMode: boolean = false;
    
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
        // 重置三消模式标志
        this.isSanxiaoMode = false;
        
        // 重置TObject中的静态变量
        // 通过反射获取TObject类并重置静态变量
        // 注意：这里我们需要获取场景中的TObject实例来重置静态变量
        // 由于静态变量属于类而不是实例，我们需要通过其他方式重置
        
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
        
        // 生成卡片对 - 根据当前等级智能选择卡牌
        const cardTypes: number[] = [];
        
        // 根据关卡难度调整新旧卡牌比例
        let newCardRatio: number;
        if (level_playing === 0) {
            // 第一关：100%新卡牌，让玩家熟悉基础卡牌
            newCardRatio = 1.0;
        } else if (level_playing < 5) {
            // 前5关：95%新卡牌，5%复习卡牌
            newCardRatio = 0.95;
        } else if (level_playing < 10) {
            // 5-10关：85%新卡牌，15%复习卡牌
            newCardRatio = 0.85;
        } else if (level_playing < 20) {
            // 10-20关：75%新卡牌，25%复习卡牌
            newCardRatio = 0.75;
        } else {
            // 20关以上：60%新卡牌，40%复习卡牌（增加难度）
            newCardRatio = 0.6;
        }
        
        const newCardPairs = Math.ceil(totalPairs * newCardRatio);
        const reviewCardPairs = totalPairs - newCardPairs;
        
        // 生成当前关卡的卡牌类型
        for (let i = 0; i < newCardPairs; i++) {
            const type = Math.floor(Math.random() * count) + (level_playing + 1);
            cardTypes.push(type);
            cardTypes.push(type); // 成对添加
        }
        
        // 生成复习卡牌类型（从之前关卡选择）
        for (let i = 0; i < reviewCardPairs; i++) {
            let type: number;
            
            // 根据关卡数智能选择复习范围
            if (level_playing <= 1) {
                // 第2关：只复习第1关的卡牌
                type = Math.floor(Math.random() * LevelMgr.getCount(0)) + 1;
            } else if (level_playing <= 3) {
                // 第3-4关：复习前2关的卡牌
                const reviewLevel = Math.floor(Math.random() * 2); // 0或1
                type = Math.floor(Math.random() * LevelMgr.getCount(reviewLevel)) + (reviewLevel + 1);
            } else if (level_playing <= 10) {
                // 第5-10关：复习前4关的卡牌
                const reviewLevel = Math.floor(Math.random() * Math.min(4, level_playing));
                type = Math.floor(Math.random() * LevelMgr.getCount(reviewLevel)) + (reviewLevel + 1);
            } else {
                // 10关以上：复习前10关的卡牌，但更倾向于近期关卡
                // 70%概率复习最近5关，30%概率复习更早的关卡
                let reviewLevel: number;
                if (Math.random() < 0.7) {
                    // 复习最近5关
                    reviewLevel = level_playing - 1 - Math.floor(Math.random() * Math.min(5, level_playing));
                } else {
                    // 复习更早的关卡
                    reviewLevel = Math.floor(Math.random() * Math.min(10, level_playing - 5));
                }
                type = Math.floor(Math.random() * LevelMgr.getCount(reviewLevel)) + (reviewLevel + 1);
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
        const width = (this.isInfiniteMode || this.isSanxiaoMode) ? this.infiniteWid : this.wid;
        const height = (this.isInfiniteMode || this.isSanxiaoMode) ? this.infiniteHei : this.hei;
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
        // 注意：mapPos是基于1的索引，而卡牌的x,y属性是基于0的索引
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
        // 重置三消模式标志
        this.isSanxiaoMode = false;

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
    
    // 创建三消模式关卡
    CreateSanxiaoMode(width: number, height: number) {
        this.gameOver = false;
        // 确保设置三消模式标志
        this.isSanxiaoMode = true;
        // 重置无限模式标志
        this.isInfiniteMode = false;
        // 使用传入的参数设置网格尺寸
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

        // 获取可用类型数量（减少类型数量以降低难度）
        this.pl = this.plSprites;
        // 只使用较少的卡牌类型以降低难度
        const availableTypes = Math.min(4, this.pl.length - 1); // 最多使用4种类型
        if (availableTypes < 2) {
            console.error('图片类型不足，至少需要2个');
            return;
        }

        // 填充整个网格
        for (let x = 0; x < this.infiniteWid; x++) {
            for (let y = 0; y < this.infiniteHei; y++) {
                // 随机类型（使用较少的类型以降低难度）
                const type = Math.floor(Math.random() * availableTypes) + 1;

                // 更新地图
                gridcreator.map[x + 1][y + 1] = type;

                // 生成卡片
                const mapPos = new Vec2(x + 1, y + 1);
                this.SpawnCard(mapPos, type);
            }
        }
    
        console.log(`三消模式创建完成，网格大小: ${this.infiniteWid}x${this.infiniteHei}，使用${availableTypes}种卡牌类型`);
    }
    
    /**
     * 检查并消除符合条件的卡牌组合（三消模式）
     */
    /**
     * 在方块消失位置显示+1分提示
     */
    private showScorePopup(position: Vec3): void {
        try {
            // 创建分数提示节点
            const scorePopup = new Node('ScorePopup');
            
            // 添加UI组件以确保正确的渲染层级
            const uiTransform = scorePopup.addComponent(UITransform);
            uiTransform.setContentSize(150, 80); // 增大UI组件大小以适应更大的字体
            
            // 添加Label组件
            const label = scorePopup.addComponent(Label);
            label.string = '+1';
            label.fontSize = 48; // 加大字体大小
            
            // 设置金色文字
            label.color = new Color(255, 215, 0, 255);
            
            // 尝试设置字体 - 在Cocos Creator中，我们需要确保有有效的字体资源
            // 如果有默认字体，使用它；否则使用系统默认字体
            try {
                // 尝试使用内置字体或已加载的字体
                if (label.font) {
                    // 字体已存在，保持不变
                } else {
                    // 如果无法设置字体，则至少确保其他属性正确设置
                    console.warn('Font resource not explicitly set, using system default');
                }
            } catch (e) {
                console.warn('Failed to set font:', e);
            }
            
            // 设置文本对齐方式
            try {
                label.horizontalAlign = Label.HorizontalAlign.CENTER;
                label.verticalAlign = Label.VerticalAlign.CENTER;
            } catch (e) {
                // 如果上面的方法失败，使用更简单的方式
                console.log('使用默认对齐方式');
            }
            
            // 初始设置为完全透明，等待卡牌消失后再显示
            label.color = new Color(255, 215, 0, 0);
            
            // 设置本地坐标
            scorePopup.setPosition(position);
            
            // 添加到父节点
            this.node.addChild(scorePopup);
            
            // 保存初始颜色
            const originalColor = new Color(255, 215, 0, 255);
            
            // 使用tween动画：先等待卡牌消失（0.3秒），然后显示加分提示
            tween(scorePopup)
                .delay(0.3) // 等待卡牌消失动画完成
                .call(() => {
                    // 卡牌消失后，开始显示加分提示
                    label.color = originalColor;
                })
                .to(0.8, { position: new Vec3(position.x, position.y + 80, position.z) }, { 
                    easing: 'sineOut',
                    onUpdate: (target, ratio) => {
                        // 在动画过程中更新缩放
                        const scaleRatio = 1 + 0.8 * ratio; // 加大缩放效果
                        target.setScale(new Vec3(scaleRatio, scaleRatio, 1));
                        
                        // 前0.6秒保持完全不透明，后0.5秒淡出
                        if (ratio > 0.6) {
                            const fadeRatio = (ratio - 0.6) / 0.4;
                            const alpha = originalColor.a * (1 - fadeRatio);
                            label.color = new Color(originalColor.r, originalColor.g, originalColor.b, Math.floor(alpha));
                        }
                    }
                })
                .delay(0.3) // 等待淡出完成
                .call(() => {
                    // 确保动画结束后再销毁
                    if (scorePopup && scorePopup.isValid) {
                        scorePopup.destroy();
                    }
                })
                .start();
        } catch (error) {
            console.error('显示分数提示失败:', error);
        }
    }

    public async checkAndEliminateSanxiao(): Promise<boolean> {
        // 获取所有可消除的卡牌组合（为了兼容性保留此方法，但实际使用checkAndEliminateSanxiaoForCards）
        const eliminableCards = this.findEliminableCards();
        
        if (eliminableCards.length > 0) {
            // 消除卡牌
            for (const card of eliminableCards) {
                // 记录消除位置
                const eliminatePos = card.node.position.clone();
                // 显示分数提示
                this.showScorePopup(eliminatePos);
                
                // 标记为已消除
                card.released = true;
                // 更新地图数据
                gridcreator.map[card.x + 1][card.y + 1] = 0;
            }
            
            // 等待一小段时间再销毁卡牌，让玩家看到消除效果
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 从场景中移除并销毁卡牌
            for (const card of eliminableCards) {
                // 直接销毁卡牌节点
                card.node.destroy();
            }
            
            // 触发积分增加事件 - 每消除一个卡牌加一分
            Main.DispEvent('event_add_jifen',eliminableCards.length);
            
            // 等待一小段时间
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 让卡牌下落填充空位
            await this.dropCardsDown();
            
            // 生成新的卡牌填充空位
            this.generateNewCards();
            
            return true; // 有消除操作
        }
        
        return false; // 没有消除操作
    }
    
    /**
     * 检查并消除指定卡牌形成的符合条件的卡牌组合（三消模式）
     * 只检查与指定卡牌相连形成3个或以上连续卡牌的组合
     */
    public async checkAndEliminateSanxiaoForCards(cards: any[]): Promise<boolean> {
        const eliminableCards = new Set();
        
        // 检查每个指定的卡牌
        for (const card of cards) {
            // 检查横向连续
            const horizontalCards = this.findHorizontalConnectedCards(card);
            if (horizontalCards.length >= 3) {
                for (const c of horizontalCards) {
                    eliminableCards.add(c);
                }
            }
            
            // 检查纵向连续
            const verticalCards = this.findVerticalConnectedCards(card);
            if (verticalCards.length >= 3) {
                for (const c of verticalCards) {
                    eliminableCards.add(c);
                }
            }
        }
        
        // 如果有可消除的卡牌
        if (eliminableCards.size > 0) {
            const eliminableCardsArray = Array.from(eliminableCards) as any[];
            
            // 消除卡牌
            for (const card of eliminableCardsArray) {
                // 记录消除位置
                const eliminatePos = (card as any).node.position.clone();
                // 显示分数提示
                this.showScorePopup(eliminatePos);
                
                // 标记为已消除
                (card as any).released = true;
                // 更新地图数据
                gridcreator.map[(card as any).x + 1][(card as any).y + 1] = 0;
            }
            
            // 等待一小段时间再销毁卡牌，让玩家看到消除效果
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 从场景中移除并销毁卡牌
            for (const card of eliminableCardsArray) {
                // 直接销毁卡牌节点
                (card as any).node.destroy();
            }
            
            // 触发积分增加事件 - 每消除一个卡牌加一分
            Main.DispEvent('event_add_jifen',eliminableCardsArray.length);
            // 等待一小段时间
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 让卡牌下落填充空位
            await this.dropCardsDown();
            
            // 生成新的卡牌填充空位
            this.generateNewCards();
            
            return true; // 有消除操作
        }
        
        return false; // 没有消除操作
    }
    
    /**
     * 查找所有可消除的卡牌组合（三消模式）
     */
    private findEliminableCards(): any[] {
        const eliminableCards: any[] = [];
        const processedCards = new Set();
        
        // 检查横向连续三个或以上相同类型的卡牌
        for (let y = 0; y < this.infiniteHei; y++) {
            let count = 1;
            let currentType = -1;
            const sameTypeCards: any[] = [];
            
            for (let x = 0; x < this.infiniteWid; x++) {
                const card = this.findCardAt(x, y);
                if (card && !card.released) {
                    if (card.type === currentType) {
                        count++;
                        sameTypeCards.push(card);
                    } else {
                        // 检查之前的连续卡牌是否达到消除条件
                        if (count >= 3 && currentType !== -1) {
                            for (const c of sameTypeCards) {
                                if (!processedCards.has(c)) {
                                    eliminableCards.push(c);
                                    processedCards.add(c);
                                }
                            }
                        }
                        
                        // 重置计数
                        count = 1;
                        currentType = card.type;
                        sameTypeCards.length = 0;
                        sameTypeCards.push(card);
                    }
                } else {
                    // 遇到空位或已消除的卡牌，检查之前的连续卡牌是否达到消除条件
                    if (count >= 3 && currentType !== -1) {
                        for (const c of sameTypeCards) {
                            if (!processedCards.has(c)) {
                                eliminableCards.push(c);
                                processedCards.add(c);
                            }
                        }
                    }
                    
                    // 重置计数
                    count = 0;
                    currentType = -1;
                    sameTypeCards.length = 0;
                }
            }
            
            // 检查最后一组连续卡牌
            if (count >= 3 && currentType !== -1) {
                for (const c of sameTypeCards) {
                    if (!processedCards.has(c)) {
                        eliminableCards.push(c);
                        processedCards.add(c);
                    }
                }
            }
        }
        
        // 检查纵向连续三个或以上相同类型的卡牌
        for (let x = 0; x < this.infiniteWid; x++) {
            let count = 1;
            let currentType = -1;
            const sameTypeCards: any[] = [];
            
            for (let y = 0; y < this.infiniteHei; y++) {
                const card = this.findCardAt(x, y);
                if (card && !card.released) {
                    if (card.type === currentType) {
                        count++;
                        sameTypeCards.push(card);
                    } else {
                        // 检查之前的连续卡牌是否达到消除条件
                        if (count >= 3 && currentType !== -1) {
                            for (const c of sameTypeCards) {
                                if (!processedCards.has(c)) {
                                    eliminableCards.push(c);
                                    processedCards.add(c);
                                }
                            }
                        }
                        
                        // 重置计数
                        count = 1;
                        currentType = card.type;
                        sameTypeCards.length = 0;
                        sameTypeCards.push(card);
                    }
                } else {
                    // 遇到空位或已消除的卡牌，检查之前的连续卡牌是否达到消除条件
                    if (count >= 3 && currentType !== -1) {
                        for (const c of sameTypeCards) {
                            if (!processedCards.has(c)) {
                                eliminableCards.push(c);
                                processedCards.add(c);
                            }
                        }
                    }
                    
                    // 重置计数
                    count = 0;
                    currentType = -1;
                    sameTypeCards.length = 0;
                }
            }
            
            // 检查最后一组连续卡牌
            if (count >= 3 && currentType !== -1) {
                for (const c of sameTypeCards) {
                    if (!processedCards.has(c)) {
                        eliminableCards.push(c);
                        processedCards.add(c);
                    }
                }
            }
        }
        
        return eliminableCards;
    }
    
    /**
     * 查找指定方向上连续的相同类型卡牌
     */
    private findConnectedCardsInDirection(card: any, direction: 'horizontal' | 'vertical'): any[] {
        const connectedCards: any[] = [];
        const type = card.type;
        const startX = card.x;
        const startY = card.y;
        
        // 向左/上查找（不包括自身）
        for (let i = -1; ; i--) {
            const x = direction === 'horizontal' ? startX + i : startX;
            const y = direction === 'vertical' ? startY + i : startY;
            
            if (x < 0 || y < 0) break;
            
            const c = this.findCardAt(x, y);
            if (c && !c.released && c.type === type) {
                connectedCards.push(c);
            } else {
                break;
            }
        }
        
        // 添加自身
        connectedCards.push(card);
        
        // 向右/下查找（不包括自身）
        for (let i = 1; ; i++) {
            const x = direction === 'horizontal' ? startX + i : startX;
            const y = direction === 'vertical' ? startY + i : startY;
            
            if (x >= (direction === 'horizontal' ? this.infiniteWid : this.infiniteWid) || 
                y >= (direction === 'vertical' ? this.infiniteHei : this.infiniteHei)) break;
            
            const c = this.findCardAt(x, y);
            if (c && !c.released && c.type === type) {
                connectedCards.push(c);
            } else {
                break;
            }
        }
        
        return connectedCards;
    }
    
    /**
     * 查找指定卡牌横向连续的卡牌
     */
    private findHorizontalConnectedCards(card: any): any[] {
        return this.findConnectedCardsInDirection(card, 'horizontal');
    }
    
    /**
     * 查找指定卡牌纵向连续的卡牌
     */
    private findVerticalConnectedCards(card: any): any[] {
        return this.findConnectedCardsInDirection(card, 'vertical');
    }
    
    /**
     * 根据坐标查找卡牌（三消模式）
     */
    private findCardAt(x: number, y: number): any {
        const children = this.node.children;
        for (const child of children) {
            const card = child.getComponent('TObject') as any;
            // 注意：卡牌的x和y属性是基于0的索引，而传入的x,y是基于1的索引减1
            // 但对于在网格外生成的卡牌（如y为负数），我们需要特殊处理
            if (card && card.x === x && card.y === y) {
                return card;
            }
        }
        return null;
    }
    
    /**
     * 让卡牌上移填充空位（三消模式）- 修改为自上而下填充
     */
    private async dropCardsDown(): Promise<void> {
        // 对每一列进行处理
        for (let x = 0; x < this.infiniteWid; x++) {
            // 从上往下检查每一行（修改：从顶部开始向下）
            for (let y = 0; y < this.infiniteHei; y++) {
                // 如果当前位置为空
                if (gridcreator.map[x + 1][y + 1] === 0) {
                    // 向下查找第一个非空卡牌（修改：改为向下查找）
                    for (let downY = y + 1; downY < this.infiniteHei; downY++) {
                        const card = this.findCardAt(x, downY);
                        if (card && !card.released) {
                            // 找到可上移的卡牌，更新地图数据
                            gridcreator.map[x + 1][y + 1] = gridcreator.map[card.x + 1][card.y + 1];
                            gridcreator.map[card.x + 1][card.y + 1] = 0;
                             
                            // 更新卡牌位置属性
                            card.x = x;
                            card.y = y;
                            card.node.name = `${card.x},${card.y}`;
                             
                            // 计算新位置
                            const newPos = this.tref.add(new Vec2(card.x * this.gridsize, card.y * this.gridsize));
                             
                            // 使用tween动画实现上移效果
                            tween(card.node)
                                .to(0.3, { position: new Vec3(newPos.x, newPos.y) }, { easing: 'bounceOut' })
                                .start();
                             
                            // 跳出内层循环，继续处理下一位置
                            break;
                        }
                    }
                }
            }
        }
         
        // 等待所有移动动画完成
        await new Promise(resolve => setTimeout(resolve, 350));
    }
    
    /**
     * 生成新的卡牌填充空位（三消模式）- 修改为自上而下填充
     */
    private generateNewCards(): Promise<void> {
        return new Promise<void>((resolve) => {
            const riseAnimations: Promise<void>[] = [];
            
            // 从左到右处理每一列
            for (let x = 0; x < this.infiniteWid; x++) {
                // 收集当前列的所有空位
                const emptyPositions: {x: number, y: number}[] = [];
                for (let y = 0; y < this.infiniteHei; y++) {
                    const card = this.findCardAt(x, y);
                    if (!card || card.released) {
                        emptyPositions.push({x, y});
                    }
                }
                
                // 按从上到下的顺序处理空位，实现从下方到上方的填充效果
                emptyPositions.sort((a, b) => a.y - b.y);
                
                // 从上到下处理空位（这样新卡牌会从下方上升填充上面的空位）
                for (let i = 0; i < emptyPositions.length; i++) {
                    const pos = emptyPositions[i];
                    const y = pos.y;
                    const x = pos.x;
                    
                    // 随机生成卡牌类型（使用较少的类型以降低难度）
                    const availableTypes = Math.min(4, this.pl.length - 1);
                    if (availableTypes >= 1) {
                        const type = Math.floor(Math.random() * availableTypes) + 1;
                        
                        // 更新地图数据
                        gridcreator.map[x + 1][y + 1] = type;
                        
                        // 在网格底部之外生成新卡牌（修改：从底部生成）
                        const cx = instantiate(this.item);
                        this.node.addChild(cx);
                        
                        // 设置卡牌位置（在网格底部之外）
                        const rect = cx.getComponent(UITransform)!;
                        cx.name = `${x},${y}`;
                        rect.setContentSize(this.gridsize, this.gridsize);
                        // 起始位置在网格底部之外
                        const startPos = this.tref.add(new Vec2(x * this.gridsize, this.infiniteHei * this.gridsize));
                        rect.anchorPoint = new Vec2(0, 0);
                        cx.setPosition(startPos.x, startPos.y);
                        
                        // 设置精灵
                        const xx = this.pl[type];
                        const tobj = cx.getComponent('TObject') as any;
                        tobj?.SetSprite(x, y, type, xx, this);
                        
                        // 计算目标位置
                        const targetPos = this.tref.add(new Vec2(x * this.gridsize, y * this.gridsize));
                        
                        // 创建上升动画的Promise
                        const animationPromise = new Promise<void>((animationResolve) => {
                            tween(cx)
                                .to(0.5, { position: new Vec3(targetPos.x, targetPos.y) }, { easing: 'bounceOut' })
                                .call(() => animationResolve())
                                .start();
                        });
                        
                        riseAnimations.push(animationPromise);
                    }
                }
            }
            
            // 等待所有上升动画完成
            Promise.all(riseAnimations).then(() => {
                console.log('所有新卡牌上升动画完成');
                resolve(); // 解析Promise，表示生成新卡牌完成
            });
        });
    }
}