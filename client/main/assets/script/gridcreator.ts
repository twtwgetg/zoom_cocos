import { _decorator, Component, Node, Sprite, UITransform, Vec2, instantiate, director, Prefab, math, Vec3, tween, Label, Color, Button, SpriteFrame, input, Input } from 'cc';
import { Main } from './main';
import { LevelMgr, GameMode, GameType } from './levelmgr';
import { frm_main } from './ui/frm_main';
import { item_tools } from './item/item_tools';
import { tools } from './tools';
import { TObject } from './Card/TObject';
import { TBlock } from './Card/TBlock';
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
    public static map: (number | number[])[][] = [];
    public gridsize: number = 100;
    private level_cur: number = 0;
    private pl: SpriteFrame[] = [];

    private gameOver: boolean = false; // 游戏结束标志

    // 添加游戏类型变量
    public gameType: GameType = GameType.NORMAL;
    
    // 添加兼容性getter方法
    public get isSanxiaoMode(): boolean {
        return this.gameType === GameType.SANXIAO;
    }
    
    public get isLayerSplitMode(): boolean {
        return this.gameType === GameType.LAYER_SPLIT;
    }
    public get isLianliankanMode(): boolean {
        return this.gameType === GameType.NORMAL;
    }
    public get isInfiniteMode(): boolean {
        return this.gameType === GameType.INFINITE;
    }
    public get isMemMode(): boolean {
        return this.gameType === GameType.MEM;
    }
    public get NeedJiShi(): boolean {
        return this.gameType === GameType.NORMAL;
    }
    onLoad() {
        // 注册事件
        this.registEvents();
    }

    private registEvents() {
        // 这里假设Main是一个全局的事件管理类，在Cocos中可以使用director或自定义事件管理器
        
        Main.RegistEvent('event_tixing',(x)=>{
            const children = this.node.children;
            for (const child of children) {
                const p = child.getComponent('TObject') as TObject;
                if (!p) continue;

                if (p.Tixing()) {
                    break;
                }
            }
        });

        Main.RegistEvent('CARD_ANIMATIONS_COMPLETE', (x)=>{
            if(this.gameType === GameType.LAYER_SPLIT){
                this.updateAllCardMaskStatus();
            }
            else{

            }
        })

        Main.RegistEvent('event_move_to_container', (x)=>{
            const children = this.node.children;
            for (const child of children) {
                for(let i=0;i<child.children.length;i++){
                    const p = child.children[i].getComponent('TObject') as TObject;
                    if (!p) continue;
                    p.updateMaskStatus();
                } 
            }
        });

        Main.RegistEvent('GET_CARD_GUIDE', (x)=>{
            const children = this.node.children;
            for (const child of children) {
                const p = child.getComponent('TObject') as TObject;
                if (!p) continue;

                let tx = p.GetTixing(); 
                if(tx.length>0){
                    return tx;
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
            
            // 游戏胜利时发放关卡奖励
            this.distributeLevelRewards(x);
            
            return null;
        })
        Main.RegistEvent('event_showfront', (x)=>{
            
            for (const child of this.node.children) {
                const p = child.getComponent('TObject') as any;
                if (!p) continue;
                p.Select(3000);
            }
            return null;
        })

        Main.RegistEvent('event_brush', (x)=>{
            this.brushkind();
            return null;
        });
        
        // 添加事件：获取网格创建器实例
        Main.RegistEvent('event_get_gridcreator', () => {
            return this;
        });
        
        // 添加事件：获取网格中的子节点
        Main.RegistEvent('event_get_grid_children', () => {
            if(this.isLayerSplitMode){
                for(let i=0;i<this.node.children.length;i++){
                    const layerx = this.node.children[i];
                    if(layerx.children.length>0){
                        return layerx.children;
                    }
                }
                return [];
            }
            return this.node.children;
        });
        
        // 添加事件：检查网格中是否还有卡牌（用于分层叠加模式）
        Main.RegistEvent('event_has_cards_in_grid', () => {
            // 修复：在分层叠加模式下，需要检查地图数据
            if (this.isLayerSplitMode) {
                for(let layer = 0; layer < this.node.children.length;layer++){
                    const layerx = this.node.children[layer];
                    if(layerx.children.length>0){
                        return true;
                    }
                }
                // 如果所有位置都为空，说明没有卡牌了
                return false;
            } else {
                // 在普通模式下，检查节点数量
                return this.node.children.length > 0;
            }
        });
        
        // 添加事件：清空网格中的所有卡牌（用于分层叠加模式失败时）
        Main.RegistEvent('event_clear_grid_cards', () => {
            this.clear();
            return null;
        });
        
        // 添加事件：显示分数弹出效果（用于分层叠加模式）
        Main.RegistEvent('event_show_score_popup', (position) => {
            if (position) {
                this.showScorePopup(position);
            }
            return null;
        });
        
        // 添加事件：将卡牌从卡槽移回网格（用于分层叠加模式）
        Main.RegistEvent('event_move_card_to_grid', (cardNode) => {
            if (cardNode && cardNode instanceof Node) {
                this.moveCardToGrid(cardNode);
            } else {
                console.warn('无效的卡牌节点参数:', cardNode);
            }
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
            Main.DispEvent("event_msg_top",{msg: `时间冷却: ${cooldownTime / 1000}秒`});
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
 
    get plSprites(): SpriteFrame[] {
        // 这里需要适配Cocos的资源获取方式
        // 假设Main.DispEvent是一个全局事件分发函数
        return Main.DispEvent('EVENT_GETPLSPRITES');// (director.emit('EVENT_GETRES') as unknown) as Sprite[];
    } 

    clear(){
        this.node.removeAllChildren();
    }
    /**
     * 记忆模式
     * @param wid 
     * @param hei 
     * @returns 
     */
    CreateMem(wid: number, hei: number) {
        this.gameOver = false;
        // 确保设置游戏类型为记忆模式
        this.gameType = GameType.MEM;
        
        // 设置网格尺寸
        this.wid = wid;
        this.hei = hei;
        
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
        this.gridsize = Math.min(180, this.gridsize);
        
        // 计算总格子数和对数
        const totalCells = this.wid * this.hei;
        const totalPairs = Math.floor(totalCells / 2);
        
        // 获取可用类型数量
        this.pl = this.plSprites;
        // 根据格子数量设置卡牌种类数量为格子数量/4
        const availableTypes = Math.min(Math.max(4, Math.floor(totalCells / 4)), this.pl.length - 1); // 至少4种卡牌，最多不超过可用类型
        if (availableTypes < 2) {
            console.error('图片类型不足，至少需要2个');
            return;
        }

        // 生成卡牌：3（成3个才能消除）* 20（卡牌种类）* 5（每种卡牌数量5组）= 300个卡牌
        const cardTypes: number[] = [];
        
        // 为每种类型生成5组，每组3个相同的卡牌
        for (let type = 1; type <= availableTypes; type++) {
            for (let group = 0; group < 5; group++) { // 5组
                for (let i = 0; i < 3; i++) { // 每组3个
                    cardTypes.push(type);
                }
            }
        }
        
        // 打乱卡牌类型数组
        this.Shuffle(cardTypes);
        
        // 生成所有位置
        const positions: Vec2[] = [];
        for (let i = 0; i < this.wid; i++) {
            for (let j = 0; j < this.hei; j++) {
                positions.push(new Vec2(i + 1, j + 1));
            }
        }
        
        // 打乱位置
        this.Shuffle(positions);
        
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
            let card1 = this.SpawnCard(pos1, type);
            let card1Obj = card1.getComponent('TObject') as TObject;
            card1Obj.SetHideMode(true);
            let card2 = this.SpawnCard(pos2, type);
            let card2Obj = card2.getComponent('TObject') as TObject;
            card2Obj.SetHideMode(true);

        }
        
        this.PlayEffect();
    }
    
    Create(level_playing: number) {
        this.gameOver = false;
        // 确保重置游戏类型为普通模式
        this.gameType = GameType.NORMAL;
        
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
        this.gridsize = Math.min(180, this.gridsize);

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
        const cardTypesCount = Math.min(Math.max(4, Math.floor(totalCells / 4)), availableTypes);
        // 生成卡片对 - 根据当前等级和游戏模式智能选择卡牌
        const cardTypes: number[] = [];
        for (let i = 0; i < cardTypesCount*4; i++) {
            cardTypes.push(i + 1);
            cardTypes.push(i + 1); // 成对添加
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

        this.PlayEffect();
    }
    /**
     * 播放出场效果
     */
    PlayEffect() {
        // 计算中心点位置 
        const centerX = 0;
        const centerY = 0;
        
        // 创建一个数组来存储所有的卡片动画Promise
        const cardPromises: Promise<void>[] = [];
        
        if(this.gameType == GameType.LAYER_SPLIT){
            // 分层叠加模式，不播放动画
            for(let layer = 0; layer < this.totallayer; layer++){
                let layerNode = this.node.children[layer];
                let layerChildren = layerNode.children;
                
                for(let i = 0; i < layerChildren.length; i++) {
                    const child = layerChildren[i];     
                    const card = child.getComponent('TObject') as TObject;
                    if (card) {
                        // 获取卡片的初始位置
                        const originalPosition = child.position.clone();  
                        // 生成随机的聚集位置（在中心点附近）
                        const randomOffsetX = (Math.random() - 0.5) * 200;
                        const randomOffsetY = (Math.random() - 0.5) * 200;
                        const gatherPos = new Vec3(
                            centerX + randomOffsetX,
                            centerY + randomOffsetY,
                            originalPosition.z
                        );
                        card.oldpos = child.position.clone(); // 保存原始位置
                        // 先将所有卡片移动到随机聚集位置
                        child.setPosition(gatherPos); 
                    }
                }
            }
        }
        else{
            // 为每个卡片创建动画
            for(let i = 0; i < this.node.children.length; i++) {
                const child = this.node.children[i];
                const card = child.getComponent('TObject') as TObject;
                if (card) {
                    // 保存原始位置
                    const originalPosition = child.position.clone();
                    
                    // 生成随机的聚集位置（在中心点附近）
                    const randomOffsetX = (Math.random() - 0.5) * 200;
                    const randomOffsetY = (Math.random() - 0.5) * 200;
                    const gatherPos = new Vec3(
                        centerX + randomOffsetX,
                        centerY + randomOffsetY,
                        originalPosition.z
                    );
                    card.oldpos = child.position.clone(); // 保存原始位置
                    // 先将所有卡片移动到随机聚集位置
                    child.setPosition(gatherPos); 
                }
            }
        }
       
        
        // 延迟0.5秒后播放tUpdateCardPositions动画
        setTimeout(() => {
            this.tUpdateCardPositions(1.0, () => {
                Main.DispEvent('CARD_ANIMATIONS_COMPLETE');
            });
        }, 500);
    }
    
    private tUpdateCardPositions(time=0.3, onComplete?: () => void) {

        // 计算中心点位置
        const centerX = 0;
        const centerY = 0;
        
        // 计算需要执行动画的子节点数量
        let allcard=[];
        let totalAnimatedChildren = 0;
        if(this.gameType == GameType.LAYER_SPLIT){
            // 分层叠加模式，不播放动画
            for(let layer = 0; layer < this.totallayer; layer++){
                let layerNode = this.node.children[layer];
                let layerChildren = layerNode.children;
                
                for(let i = 0; i < layerChildren.length; i++) {
                    const child = layerChildren[i];     
                    const card = child.getComponent('TObject') as TObject;
                    if (card) {
                        totalAnimatedChildren++;
                        allcard.push(card);
                    }
                }
            }
        }
        else{
            // 为每个卡片创建动画
            const children = this.node.children;
            for (const child of children) {
                const tobj = child.getComponent('TObject') as TObject;
                if (tobj && tobj.x !== undefined && tobj.y !== undefined) {
                    totalAnimatedChildren++;
                    allcard.push(tobj);
                }
            }
        }
        
        // 如果没有需要动画的子节点，直接执行完成回调
        if (totalAnimatedChildren === 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }
        
        let completedAnimations = 0;
        
        for (const tobj of allcard) {
            // 添加空值检查，防止tobj为null时出现错误
            if (!tobj || tobj.x === undefined || tobj.y === undefined) {
                continue;
            }
            const child = tobj.node;
            //let pos = this.tref.add(new Vec2((tobj.x) * this.gridsize, (tobj.y) * this.gridsize)); 
            const targetPos = tobj.oldpos;
            
            // 设置初始位置为中心点，实现爆炸效果
            child.setPosition(new Vec3(centerX, centerY, 0));
            
            // 添加随机缩放和旋转初始值，增强爆炸效果
            const randomScale = 0.1 + Math.random() * 0.3;
            const randomRotation = (Math.random() - 0.5) * 60;
            child.setScale(new Vec3(randomScale, randomScale, 1));
            child.angle = randomRotation;
            
            // 使用tween动画实现爆炸式展开效果
            tween(child)
                .to(time, { 
                    position: targetPos,
                    scale: new Vec3(1, 1, 1),
                    angle: 0
                }, { 
                    easing: 'backOut', // 使用回弹缓动，增强爆炸感
                    onComplete: () => {
                        // 动画完成后确保最终位置正确
                        child.setPosition(targetPos);
                        
                        // 增加完成计数
                        completedAnimations++;
                        
                        // 检查是否所有动画都已完成
                        if (completedAnimations >= totalAnimatedChildren && onComplete) {
                            onComplete();
                        }
                    }
                })
                .start();
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

    private UpdateCardPositions(time=0.3) {
        const children = this.node.children;
        for (const child of children) {
            const tobj = child.getComponent('TObject') as any;
            // 添加空值检查，防止tobj为null时出现错误
            if (!tobj || tobj.x === undefined || tobj.y === undefined) {
                continue;
            }
            
            let pos = this.tref.add(new Vec2((tobj.x) * this.gridsize, (tobj.y) * this.gridsize)); 
            const targetPos = new Vec3(pos.x, pos.y, 0);
            
            // 只有当前位置与目标位置不同时才执行动画
            if (child.position.x != targetPos.x || child.position.y != targetPos.y) {
                // 使用tween动画实现平滑位移效果
                tween(child)
                    .to(time, { position: targetPos }, { 
                        easing: 'sineOut',
                        onComplete: () => {
                            // 动画完成后确保最终位置正确
                            child.setPosition(targetPos);
                        }
                    })
                    .start();
            }
        }
    }

    get tref(): Vec2 {
        const rect = this.node.getComponent(UITransform);
        // 修复：添加对分层叠加模式的支持
        const width = (this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode) ? this.infiniteWid : this.wid;
        const height = (this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode) ? this.infiniteHei : this.hei;
        const refx = (rect.width - width * this.gridsize) / 2;
        const refy = (rect.height - height * this.gridsize) / 2;
        return new Vec2(refx-rect.width/2, refy-rect.height/2);
    }

    private MoveCardNode(cx: Node, mapPos: Vec2) {
        const rect = cx.getComponent(UITransform)!;
        cx.name = `${mapPos.x - 1},${mapPos.y - 1}`;

        rect.setContentSize(this.gridsize, this.gridsize);
        // 修复：确保分层叠加模式也使用正确的居中逻辑
        let pos =this.tref.add(new Vec2((mapPos.x - 1) * this.gridsize, (mapPos.y - 1) * this.gridsize)); 
        rect.anchorPoint = new Vec2(0,0);// 
        //设置rect的位置
        cx.setPosition(pos.x, pos.y); 
    }

    private SpawnCard(mapPos: Vec2, type: number) {
        const cx = instantiate(this.item);
        this.node.addChild(cx);

        // 设置精灵
        const xx = this.pl[type] as SpriteFrame;
        const tobj = cx.getComponent('TObject') as TObject;
        // 注意：mapPos是基于1的索引，而卡牌的x,y属性是基于0的索引
        tobj?.SetSprite(mapPos.x - 1, mapPos.y - 1, type, xx, this);

        // 为所有模式添加出场动画，传递卡牌类型确保随机性
        this.addCardEntranceAnimation(cx, mapPos, type);
        
        // 在困难模式下，为某些卡牌添加视觉干扰效果
        if (LevelMgr.gameMode === GameMode.HARD) {
            // 30%的概率添加视觉干扰效果
            if (Math.random() < 0.3) {
                this.addVisualInterference(cx, type);
            }
        }
        return cx;
    }
    
    /**
     * 为卡牌添加视觉干扰效果（仅在困难模式下使用）
     */
    private addVisualInterference(cardNode: Node, cardType: number) {
        // 添加一个半透明的遮罩层，使卡牌更难识别
        const mask = new Node('interferenceMask');
        cardNode.addChild(mask);
        
        const maskSprite = mask.addComponent(Sprite);
        // 修复：正确设置spriteFrame，从Sprite数组中获取spriteFrame
        if (this.pl[cardType] && this.pl[cardType]) {
            maskSprite.spriteFrame = this.pl[cardType]; // 使用相同类型的精灵帧
        }
        maskSprite.color = new Color(255, 255, 255, 100); // 半透明白色
        
        // 设置遮罩层的位置和大小
        const cardTransform = cardNode.getComponent(UITransform);
        if (cardTransform) {

            let maskTransform = mask.getComponent(UITransform);
            if(maskTransform==null){
               maskTransform =mask.addComponent(UITransform);
            } 
            maskTransform.setContentSize(cardTransform.contentSize);
            maskTransform.anchorPoint = new Vec2(0.5, 0.5);
            mask.setPosition(0, 0, 0);
        }
        
        // 添加轻微的旋转效果，使卡牌更难识别
        cardNode.angle = (Math.random() - 0.5) * 10; // 随机旋转-5到5度
    }

    /**
     * 添加卡牌出场动画效果
     */
    private addCardEntranceAnimation(cardNode: Node, mapPos: Vec2, cardType: number) {
        // 计算目标位置
        const targetPos2D = this.tref.add(new Vec2((mapPos.x - 1) * this.gridsize, (mapPos.y - 1) * this.gridsize));
        const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, 0);
        
        cardNode.setPosition(targetPos);
        // 根据游戏模式选择不同的动画效果
        // 修复：添加对分层叠加模式的支持
        if (this.isSanxiaoMode) {
            // 三消模式：快速简洁的动画
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));
            this.addSanxiaoEntranceAnimation(cardNode, targetPos, cardType);
        } else if (this.isLayerSplitMode) {
            // 分层叠加模式：使用特定的动画效果
                           // 设置初始状态
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));
            this.addLayerSplitEntranceAnimation(cardNode, targetPos, cardType);
        } else if(this.isInfiniteMode  )
        {
            cardNode.setScale(new Vec3(0.1, 0.1, 0.1));

            this.addLayerSplitEntranceAnimation(cardNode, targetPos, cardType);
        }
        else {
            cardNode.setScale(new Vec3(1, 1, 1));
            // 连连看模式：丰富多样的动画
            //this.addLianlianEntranceAnimation(cardNode, targetPos, cardType);
        }
        
        // 设置最终位置和大小
        const rect = cardNode.getComponent(UITransform)!;
        rect.setContentSize(this.gridsize, this.gridsize);
        rect.anchorPoint = new Vec2(0, 0);
        cardNode.name = `${mapPos.x - 1},${mapPos.y - 1}`;
    }

    // 静态计数器，确保每次调用都有不同的随机种子
    private static animationCounter: number = 0;
    
    // 连连看模式动画类型（-1表示未初始化，0-5表示具体动画类型）
    private static lianlianAnimationType: number = -1;

    /**
     * 生成更好的随机动画类型
     */
    private getRandomAnimationType(position: Vec3, cardType: number, maxTypes: number): number {
        // 使用计数器确保每次调用都有不同的随机结果
        gridcreator.animationCounter++; 

        // 使用最简单直接的方法：直接使用Math.random()
        // 这样可以确保真正的随机性
        return Math.floor(Math.random() * maxTypes);
    }

    /**
     * 重置连连看模式动画类型（每次开始新游戏时调用）
     */
    public static resetLianlianAnimationType(): void {
        gridcreator.lianlianAnimationType = -1;
    }

    /**
     * 三消模式出场动画（快速简洁）
     */
    private addSanxiaoEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        // 使用更好的随机数生成器，确保每次效果不同
        const animationType = this.getRandomAnimationType(targetPos, cardType, 3);
        
        switch (animationType) {
            case 0: // 快速缩放效果
                cardNode.setScale(new Vec3(0.8, 0.8, 1)); // 设置初始缩放值
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'backOut' })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 1: // 快速淡入效果
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 128);
                    tween(sprite)
                        .to(0.2, { color: new Color(255, 255, 255, 255) })
                        .start();
                }
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 2: // 轻微弹跳效果
                cardNode.setScale(new Vec3(0.8, 0.8, 1));
                tween(cardNode)
                    .to(0.15, { scale: new Vec3(1.05, 1.05, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            default:
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
        }
    }

    /**
     * 连连看模式出场动画（统一效果）
     */
    private addLianlianEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        // 使用静态变量确保所有卡牌使用同一种动画效果
        if (gridcreator.lianlianAnimationType === -1) {
            gridcreator.lianlianAnimationType = Math.floor(Math.random() * 6);
        }
        const animationType = gridcreator.lianlianAnimationType;
        
        switch (animationType) {
            case 0: // 缩放弹跳效果
                cardNode.setScale(new Vec3(0.5, 0.5, 1)); // 设置初始缩放值
                tween(cardNode)
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                    .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 1: // 旋转缩放效果
                cardNode.setRotationFromEuler(new Vec3(0, 0, 180));
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }),
                        tween().to(0.4, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'backOut' })
                    )
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 2: // 从上方掉落效果
                cardNode.setScale(new Vec3(1, 1, 1));
                cardNode.setPosition(targetPos.x, targetPos.y + 300, 0);
                tween(cardNode)
                    .to(0.5, { position: targetPos }, { 
                        easing: 'bounceOut',
                        onUpdate: (target, ratio) => {
                            // 掉落过程中轻微旋转
                            const rotation = Math.sin(ratio * Math.PI * 3) * 10;
                            target.setRotationFromEuler(new Vec3(0, 0, rotation));
                        }
                    })
                    .call(() => {
                        // 掉落完成后轻微弹跳
                        tween(cardNode)
                            .to(0.1, { position: new Vec3(targetPos.x, targetPos.y - 10, 0) })
                            .to(0.1, { position: targetPos })
                            .call(() => {
                                // 确保最终缩放到正常大小
                                cardNode.setScale(new Vec3(1, 1, 1));
                            })
                            .start();
                    })
                    .start();
                break;
                
            case 3: // 淡入缩放效果
                cardNode.setScale(new Vec3(0.5, 0.5, 1));
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 0);
                    tween(sprite)
                        .to(0.4, { color: new Color(255, 255, 255, 255) })
                        .call(() => {
                            // 确保最终缩放到正常大小
                            cardNode.setScale(new Vec3(1, 1, 1));
                        })
                        .start();
                }
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'elasticOut' })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 4: // 左右摇摆效果
                cardNode.setScale(new Vec3(0.1, 0.1, 1));
                tween(cardNode)
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                    .call(() => {
                        // 左右摇摆
                        tween(cardNode)
                            .to(0.1, { position: new Vec3(targetPos.x - 15, targetPos.y, 0) })
                            .to(0.1, { position: new Vec3(targetPos.x + 15, targetPos.y, 0) })
                            .to(0.1, { position: targetPos })
                            .to(0.2, { scale: new Vec3(1, 1, 1) })
                            .call(() => {
                                // 确保最终缩放到正常大小
                                cardNode.setScale(new Vec3(1, 1, 1));
                            })
                            .start();
                    })
                    .start();
                break;
                
            case 5: // 弹跳组合效果
                cardNode.setScale(new Vec3(0.3, 0.3, 1));
                cardNode.setPosition(targetPos.x, targetPos.y - 200, 0);
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { position: targetPos }, { easing: 'bounceOut' }),
                        tween().to(0.4, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'backOut' })
                    )
                    .call(() => {
                        // 弹跳后轻微缩放，确保最终缩放到正常大小
                        tween(cardNode)
                            .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                            .to(0.1, { scale: new Vec3(1, 1, 1) })
                            .call(() => {
                                // 确保最终缩放到正常大小
                                cardNode.setScale(new Vec3(1, 1, 1));
                            })
                            .start();
                    })
                    .start();
            }
    }

    /**
     * 分层叠加模式出场动画
     */
    private addLayerSplitEntranceAnimation(cardNode: Node, targetPos: Vec3, cardType: number) {
        // 使用随机数生成器，确保每次效果不同
        const animationType = this.getRandomAnimationType(targetPos, cardType, 3);
        
        switch (animationType) {
            case 0: // 缩放和旋转组合效果
                cardNode.setScale(new Vec3(0.1, 0.1, 1));
                cardNode.eulerAngles = new Vec3(0, 0, 180);
                tween(cardNode)
                    .parallel(
                        tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }),
                        tween().to(0.4, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'backOut' })
                    )
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            case 1: // 从上方掉落效果
                cardNode.setScale(new Vec3(1, 1, 1));
                cardNode.setPosition(targetPos.x, targetPos.y + 200, 0);
                tween(cardNode)
                    .to(0.5, { position: targetPos }, { 
                        easing: 'bounceOut'
                    })
                    .start();
                break;
                
            case 2: // 淡入效果
                const sprite = cardNode.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 0);
                    tween(sprite)
                        .to(0.4, { color: new Color(255, 255, 255, 255) })
                        .start();
                }
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'elasticOut' })
                    .call(() => {
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
                
            default:
                tween(cardNode)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .call(() => {
                        // 确保最终缩放到正常大小
                        cardNode.setScale(new Vec3(1, 1, 1));
                    })
                    .start();
                break;
        }
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
        
        // 修复：在分层叠加模式下，需要特殊处理
        if (this.isLayerSplitMode) {
            // 在分层叠加模式下，确保每种类型数量是3的倍数
            const typeCounts: { [key: number]: number } = {};
            
            // 收集当前所有卡牌的类型
            for (let i = 0; i < remainingCards.length; i++) {
                if (remainingCards[i] && remainingCards[i].type !== undefined) {
                    const type = remainingCards[i].type;
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                }
            }
            
            // 生成新的类型列表，确保每种类型数量是3的倍数
            const availableTypes = Math.min(15, this.pl.length - 1); // 控制在15种类型以内，增加难度
            const typesToUse: number[] = [];
            
            // 先添加现有的类型
            for (const type in typeCounts) {
                const typeNum = parseInt(type);
                const currentCount = typeCounts[type];
                const remainder = currentCount % 3;
                
                // 为每种类型添加足够的卡牌使其数量成为3的倍数
                for (let i = 0; i < currentCount + (remainder > 0 ? 3 - remainder : 0); i++) {
                    typesToUse.push(typeNum);
                }
            }
            
            // 如果卡牌数量不足，添加新的类型
            while (typesToUse.length < remainingCards.length) {
                const newType = Math.floor(Math.random() * availableTypes) + 1;
                // 添加3张相同类型的卡牌
                for (let i = 0; i < 3; i++) {
                    typesToUse.push(newType);
                }
            }
            
            // 如果卡牌数量超过需要的数量，移除多余的卡牌
            while (typesToUse.length > remainingCards.length) {
                typesToUse.pop();
            }
            
            // 打乱类型列表
            this.Shuffle(typesToUse);
            newTypes.push(...typesToUse);
        } else {
            // 在普通模式下，使用原来的方法
            for (let i = 0; i < remainingCards.length; i++) {
                // 添加空值检查，防止读取null的type属性
                if (remainingCards[i] && remainingCards[i].type !== undefined) {
                    newTypes.push(remainingCards[i].type);
                }
            }

            // 打乱类型列表
            this.Shuffle(newTypes);
        }

        // 应用新类型
        for (let i = 0; i < remainingCards.length; i++) {
            const card = remainingCards[i];
            const newType = newTypes[i];

            // 更新地图数据
            const mapPos = new Vec2(card.x + 1, card.y + 1);
            
            // 修复：在分层叠加模式下，需要特殊处理地图数据
            if (this.isLayerSplitMode) {
                // 在分层叠加模式下，确保该位置至少有一张卡牌
                const cell = gridcreator.map[mapPos.x][mapPos.y];
                if (Array.isArray(cell)) {
                    if (cell.length === 0) {
                        // 如果没有卡牌，添加一张
                        cell.push(newType);
                    } else {
                        // 如果有卡牌，更新顶层卡牌
                        cell[cell.length - 1] = newType;
                    }
                }
            } else {
                // 在普通模式下，直接更新地图数据
                gridcreator.map[mapPos.x][mapPos.y] = newType;
            }

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
        // 添加空值检查
        if (!gridcreator.map) {
            console.error("gridcreator.map is null");
            return false;
        }

        // 检查坐标是否有效
        if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0 || 
            x1 >= gridcreator.map.length || y1 >= (gridcreator.map[x1] ? gridcreator.map[x1].length : 0) ||
            x2 >= gridcreator.map.length || y2 >= (gridcreator.map[x2] ? gridcreator.map[x2].length : 0)) {
            console.warn("Invalid coordinates for CanConnect:", x1, y1, x2, y2);
            return false;
        }

        if (x1 === x2 && y1 === y2) {
            return false;
        }

        // 检查类型是否相同且不为空
        // 修复：处理分层叠加模式下的数组类型
        const cell1 = gridcreator.map[x1][y1];
        const cell2 = gridcreator.map[x2][y2];
        
        // 检查是否为分层叠加模式（数组类型）
        if (Array.isArray(cell1) && Array.isArray(cell2)) {
            // 在分层模式下，比较顶层卡牌类型
            if (cell1.length === 0 || cell2.length === 0) {
                return false;
            }
            const type1 = cell1[cell1.length - 1]; // 顶层卡牌
            const type2 = cell2[cell2.length - 1]; // 顶层卡牌
            if (type1 <= 0 || type2 <= 0 || type1 !== type2) {
                return false;
            }
        } else if (typeof cell1 === 'number' && typeof cell2 === 'number') {
            // 在普通模式下，直接比较类型
            if (cell1 <= 0 || cell2 <= 0 || cell1 !== cell2) {
                return false;
            }
        } else {
            // 类型不匹配
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
        // 添加空值检查
        if (!gridcreator.map) {
            return false;
        }

        // 水平连接
        if (x1 === x2) {
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY + 1; y < endY; y++) {
                // 添加边界检查
                if (y < 0 || y >= gridcreator.map[x1].length) {
                    return false;
                }
                // 修复：处理分层叠加模式下的数组类型
                const cell = gridcreator.map[x1][y];
                if ((Array.isArray(cell) && cell.length > 0) || 
                    (typeof cell === 'number' && cell !== 0)) {
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
                // 添加边界检查
                if (x < 0 || x >= gridcreator.map.length || y1 < 0 || y1 >= gridcreator.map[x].length) {
                    return false;
                }
                // 修复：处理分层叠加模式下的数组类型
                const cell = gridcreator.map[x][y1];
                if ((Array.isArray(cell) && cell.length > 0) || 
                    (typeof cell === 'number' && cell !== 0)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    // 检查一个转弯连接
    private static IsConnectedWithOneTurn(x1: number, y1: number, x2: number, y2: number, poslist: Vec2[]): boolean {
        // 添加空值检查
        if (!gridcreator.map) {
            return false;
        }

        // 用于存储找到的路径
        const paths: Vec2[][] = [];
        
        // 转弯点1: (x1, y2)
        // 添加边界检查
        if (x1 >= 0 && x1 < gridcreator.map.length && 
            y2 >= 0 && y2 < gridcreator.map[x1].length &&
            x2 >= 0 && x2 < gridcreator.map.length && 
            y2 >= 0 && y2 < gridcreator.map[x2].length) {
            // 修复：处理分层叠加模式下的数组类型
            const cellXY = gridcreator.map[x1][y2];
            const isEmpty = (Array.isArray(cellXY) && cellXY.length === 0) || 
                           (typeof cellXY === 'number' && cellXY === 0);
                           
            if (isEmpty && 
                gridcreator.IsDirectlyConnected(x1, y1, x1, y2) && 
                gridcreator.IsDirectlyConnected(x1, y2, x2, y2)) {
                const path: Vec2[] = [];
                path.push(new Vec2(x1, y1));
                path.push(new Vec2(x1, y2));
                path.push(new Vec2(x2, y2));
                paths.push(path);
            }
        }

        // 转弯点2: (x2, y1)
        // 添加边界检查
        if (x2 >= 0 && x2 < gridcreator.map.length && 
            y1 >= 0 && y1 < gridcreator.map[x2].length &&
            x2 >= 0 && x2 < gridcreator.map.length && 
            y2 >= 0 && y2 < gridcreator.map[x2].length) {
            // 修复：处理分层叠加模式下的数组类型
            const cellXY = gridcreator.map[x2][y1];
            const isEmpty = (Array.isArray(cellXY) && cellXY.length === 0) || 
                           (typeof cellXY === 'number' && cellXY === 0);
                           
            if (isEmpty && 
                gridcreator.IsDirectlyConnected(x1, y1, x2, y1) && 
                gridcreator.IsDirectlyConnected(x2, y1, x2, y2)) {
                const path: Vec2[] = [];
                path.push(new Vec2(x1, y1));
                path.push(new Vec2(x2, y1));
                path.push(new Vec2(x2, y2));
                paths.push(path);
            }
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
        // 添加空值检查
        if (!gridcreator.map || gridcreator.map.length === 0) {
            return false;
        }

        const rows = gridcreator.map.length;
        const cols = gridcreator.map[0].length;

        // 用于存储最短路径
        let shortestPath: Vec2[] | null = null;
        let shortestLength = Infinity;

        for (let i = 0; i < rows; i++) {
            // 添加边界检查
            if (i >= gridcreator.map.length) continue;
            
            for (let j = 0; j < cols; j++) {
                // 添加边界检查
                if (j >= gridcreator.map[i].length) continue;
                
                // 修复：处理分层叠加模式下的数组类型
                const cell = gridcreator.map[i][j];
                const isEmpty = (Array.isArray(cell) && cell.length === 0) || 
                               (typeof cell === 'number' && cell === 0);
                
                if (isEmpty) {
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
    private infiniteWid: number = 10;
    private infiniteHei: number = 10;
    
    // 创建无限模式关卡
    CreateInfiniteMode(width: number, height: number) {
        this.infiniteWid = width;
        this.infiniteHei = height;
        this.gameOver = false;
        // 确保设置游戏类型为无限模式
        this.gameType = GameType.INFINITE;

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
        
        // 随机选择卡牌类型（增加类型数量以提高难度）
        const availableTypes = Math.min(10, this.pl.length - 1); // 最多使用10种类型
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
        // 确保设置游戏类型为三消模式
        this.gameType = GameType.SANXIAO;
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

        // 获取可用类型数量（基于格子数量/4）
        this.pl = this.plSprites;
        // 根据格子数量设置卡牌种类数量为格子数量/4
        const totalSanXiaoCells = this.infiniteWid * this.infiniteHei; // 计算总格子数
        const availableTypes = Math.min(Math.max(4, Math.floor(totalSanXiaoCells / 4)), this.pl.length - 1); // 至少4种卡牌，最多不超过可用类型
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
    totallayer = 4;
    /**
     * 创建分层叠加模式关卡
     */
    CreateLayerSplitMode(width: number, height: number) {
        this.gameOver = false;
        // 确保设置游戏类型为分层叠加模式
        this.gameType = GameType.LAYER_SPLIT;
        // 使用传入的参数设置网格尺寸
        this.infiniteWid = 5;
        this.infiniteHei = 7;
    

        this.clear();

        // 计算网格大小
        const parentRect = this.node.getComponent(UITransform)!;
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;

        const cellWidth = availableWidth / this.infiniteWid;
        const cellHeight = availableHeight / this.infiniteHei;

        this.gridsize = Math.min(cellWidth, cellHeight);
        this.gridsize = Math.min(150, this.gridsize);



        //先计算一共多少实体卡牌，然后随机往格子里面塞
        
        // 获取可用类型数量
        this.pl = this.plSprites;
        // 根据格子数量设置卡牌种类数量为格子数量/4
        const totalLayerCells = this.infiniteWid * this.infiniteHei *   this.totallayer; // 计算总格子数

        
        let number =  Math.floor(totalLayerCells/3)*3;
        
        const availableTypes = Math.min(Math.max(4, Math.floor(totalLayerCells / 6)), this.pl.length - 1); // 至少4种卡牌，最多不超过可用类型
        if (availableTypes < 2) {
            console.error('图片类型不足，至少需要2个');
            return;
        }
 
        //准备层节点
        for(let layer = 1; layer <= this.totallayer; layer++){
            let layerx = new Node("layer" + layer);
            this.node.addChild(layerx); 
            layerx.setPosition(Math.random() * this.gridsize- this.gridsize/2, Math.random() * this.gridsize- this.gridsize/2, layer); 
        }

        let arr=new Array<TBlock>();
        for(let layer = 1; layer <= this.totallayer; layer++){
            for(let x = 0; x < this.infiniteWid; x++){
                for(let y = 0; y < this.infiniteHei; y++){
                    let block = new TBlock();
                    block.x = x;
                    block.y = y;
                    block.layer = layer;
                    arr.push(block);        
                }
            }   
        }
        this.Shuffle(arr);
        
        let pares=Math.floor(number/3*0.5);

        for(let i = 0; i < pares; i++){ 
            const type = Math.floor(Math.random() * availableTypes) + 1;
            for(let count = 1; count <=3; count++){
                let block = arr[i*3+count-1];
                // 获取层节点
                let layerx = this.node.getChildByName("layer" + block.layer);
                // 随机位置
                const mapPos = new Vec2(block.x + 1, block.y + 1);
                // 生成卡片
                this.SpawnLayeredCard(layerx, mapPos, type, block.layer);
            }
        }
 
        this.PlayEffect();
    }

    /**
     * 每帧更新
     */
    // protected update(dt: number): void {
    //     // 如果按下D键，刷新mask状态
    //     if (input.getTouch(0)) {
    //         this.updateAllCardMaskStatus();
    //     }
    // }

    /**
     * 更新所有卡牌的mask状态
     */
    private updateAllCardMaskStatus() {
        for (let layer = 1; layer <= this.totallayer; layer++) {
            let layerx = this.node.getChildByName("layer" + layer);
            for(let c = 0; c < layerx.children.length; c++){
                let cx = layerx.children[c];
                let tobj = cx.getComponent('TObject') as any;
                if(tobj){
                    tobj.updateMaskStatus();
                }
            }
        }
    }
    /**
     * 生成分层卡牌
     */
    private SpawnLayeredCard(layerx: Node, mapPos: Vec2, type: number, layer: number) {
        const cx = instantiate(this.item);
        layerx.addChild(cx);    
        
        // 设置精灵
        const xx = this.pl[type];
        const tobj = cx.getComponent('TObject') as any;
        if(tobj){
            tobj.layer = layer;
        }
        // 注意：mapPos是基于1的索引，而卡牌的x,y属性是基于0的索引
        tobj?.SetSprite(mapPos.x - 1, mapPos.y - 1, type, xx, this);
        tobj?.UseMaJiangBg();
        // 为分层卡牌添加特殊标识
        cx.name = `${mapPos.x - 1},${mapPos.y - 1}_layer${layer}`;
        
        // 添加位移效果以显示叠加
        // 计算基础位置
        let baseX = (mapPos.x - 1) * this.gridsize;
        let baseY = (mapPos.y - 1) * this.gridsize;
        
        // // 奇数层朝左下方偏移半个格子
        // if (layer % 2 === 1) {
        //     baseX -= this.gridsize / 2; // 向左偏移半个格子
        //     baseY -= this.gridsize / 2; // 向下偏移半个格子
        // }
        
        const targetPos2D = this.tref.add(new Vec2(baseX, baseY));
        const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, layer); // 使用z轴表示层级
        cx.setPosition(targetPos);
        
        // 设置卡牌尺寸
        const rect = cx.getComponent(UITransform)!;
        rect.setContentSize(this.gridsize, this.gridsize);
        rect.anchorPoint = new Vec2(0, 0);
    }

    @property(Prefab)
    private scorePopupNode: Prefab = null;
    /**
     * 检查并消除符合条件的卡牌组合（三消模式）
     */
    /**
     * 在方块消失位置显示+1分提示
     */
    private showScorePopup(position: Vec3): void {
        try {
            // 创建分数提示节点
            const scorePopup = instantiate(this.scorePopupNode);// new Node('ScorePopup');
            
            // 添加UI组件以确保正确的渲染层级
            const uiTransform = scorePopup.getComponent(UITransform);
            uiTransform.setContentSize(150, 80); // 增大UI组件大小以适应更大的字体
            
            // 添加Label组件
            const label = scorePopup.getComponent(Label);
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
            
            // 添加到当前节点的上一级，避免干扰游戏
            if (this.node.parent) {
                this.node.parent.addChild(scorePopup);
            } else {
                // 如果没有父节点，则添加到当前节点作为备用方案
                this.node.addChild(scorePopup);
            }
            
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
            
            // 检查游戏是否结束（所有卡牌都已消除）
            if (this.node.children.length === 0) {
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
                return true;
            }
            
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
            
            if (x >= this.infiniteWid || y >= this.infiniteHei) break;
            
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
                    
                    // 随机生成卡牌类型（使用更多的类型以进一步提高难度）
                    const availableTypes = Math.min(6, this.pl.length - 1);
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

    /**
     * 将卡牌从卡槽移回网格（用于分层叠加模式）
     * @param cardNode 要移回网格的卡牌节点
     */
    public moveCardToGrid(cardNode: Node): void {
        if (!cardNode || !cardNode.isValid) {
            console.warn('无效的卡牌节点，无法移回网格');
            return;
        }
        
        try {
            // 获取卡牌的TObject组件
            const tobj = cardNode.getComponent('TObject') as any;
            if (!tobj) {
                console.warn('卡牌没有TObject组件，无法移回网格');
                return;
            }
            
            // 获取卡牌类型
            const cardType = tobj.type;
            
            // 查找网格中的空位置
            const emptyPosition = this.findEmptyGridPosition();
            if (!emptyPosition) {
                console.warn('网格中没有空位置，无法移回卡牌');
                return;
            }
            
            // 更新地图数据
            const mapX = emptyPosition.x + 1;
            const mapY = emptyPosition.y + 1;
            
            // 修复：处理分层叠加模式下的数组类型
            if (this.isLayerSplitMode) {
                // 在分层模式下，将卡牌添加到该位置的顶层
                const cell = gridcreator.map[mapX][mapY] as number[];
                cell.push(cardType);
            } else {
                // 在普通模式下，直接设置地图数据
                gridcreator.map[mapX][mapY] = cardType;
            }
            
            // 更新卡牌的位置属性
            tobj.x = emptyPosition.x;
            tobj.y = emptyPosition.y;
            tobj.node.name = `${tobj.x},${tobj.y}`;
            
            // 计算目标位置
            const targetPos2D = this.tref.add(new Vec2(emptyPosition.x * this.gridsize, emptyPosition.y * this.gridsize));
            const targetPos = new Vec3(targetPos2D.x, targetPos2D.y, 0);
            
            // 设置卡牌尺寸
            const rect = cardNode.getComponent(UITransform)!;
            rect.setContentSize(this.gridsize, this.gridsize);
            rect.anchorPoint = new Vec2(0, 0);
            
            // 使用动画将卡牌移回网格
            tween(cardNode)
                .to(0.3, { position: targetPos, scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                .call(() => {
                    console.log(`卡牌已成功移回网格，位置: (${emptyPosition.x}, ${emptyPosition.y})`);
                    
                    // 重新启用卡牌的点击功能，确保可以再次选中并移动到卡槽
                    const button = cardNode.getComponent(Button);
                    if (button) {
                        button.enabled = true;
                        console.log('卡牌点击功能已重新启用');
                    }
                    
                    // 确保卡牌处于可点击状态
                    cardNode.active = true;
                })
                .start();
                
        } catch (error) {
            console.error('将卡牌移回网格时出错:', error);
        }
    }
    
    /**
     * 查找网格中的空位置
     */
    private findEmptyGridPosition(): Vec2 | null {
        // 根据当前模式确定网格尺寸
        const width = this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode ? this.infiniteWid : this.wid;
        const height = this.isInfiniteMode || this.isSanxiaoMode || this.isLayerSplitMode ? this.infiniteHei : this.hei;
        
        // 查找空位置
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const mapX = x + 1;
                const mapY = y + 1;
                
                // 检查该位置是否为空
                const cell = gridcreator.map[mapX][mapY];
                let isEmpty = false;
                
                if (this.isLayerSplitMode) {
                    // 在分层模式下，检查数组是否为空
                    isEmpty = Array.isArray(cell) && cell.length === 0;
                } else {
                    // 在普通模式下，检查是否为0
                    isEmpty = typeof cell === 'number' && cell === 0;
                }
                
                if (isEmpty) {
                    return new Vec2(x, y);
                }
            }
        }
        
        // 如果没有找到空位置，返回null
        return null;
    }

    /**
     * 游戏胜利时发放关卡奖励
     * @param level 关卡数（从game_win事件传递）
     */
    private distributeLevelRewards(level: any): void {
        try {
            // 获取当前关卡数
            const currentLevel = typeof level === 'number' ? level : LevelMgr.level;
            
            // 不再发放关卡奖励，而是增加积分
            // 每个关卡胜利增加10分基础积分
            const baseScore = 10;
            // 随着关卡增加，奖励积分也增加
            const levelBonus = Math.floor(currentLevel / 10); // 每10关额外增加1分
            const totalScore = baseScore + levelBonus;
            
            // 增加积分
            Main.DispEvent('event_add_jifen', totalScore);
            
            console.log(`关卡 ${currentLevel + 1} 胜利，获得积分: ${totalScore}`);
            
        } catch (error) {
            console.error('发放关卡奖励失败:', error);
        }
    }

    /**
     * 根据关卡获取奖励道具类型（与frm_guanka.ts中的逻辑保持一致）
     * @param level 关卡数
     * @returns 奖励道具类型数组
     */
    private getLevelRewards(level: number): string[] {
        // 基础奖励：三个道具
        let rewards = ['remind', 'brush', 'time'];
        
        // 随着关卡增加，奖励道具数量也增加，但每种道具数量不超过5个
        if (level > 10) {
            // 检查当前remind数量，不超过5个
            const currentRemind = tools.num_Remind;
            if (currentRemind < 5) {
                rewards.push('brush'); // 第11关开始多给一个刷子
            }
        }
        if (level > 20) {
            // 检查当前time数量，不超过5个
            const currentTime = tools.num_time;
            if (currentTime < 5) {
                rewards.push('time'); // 第21关开始多给一个时间道具
            }
        }
        if (level > 30) {
            // 检查当前remind数量，不超过5个
            const currentRemind = tools.num_Remind;
            if (currentRemind < 5) {
                rewards.push('remind'); // 第31关开始多给一个提示道具
            }
        }
        if (level > 40) {
            // 检查当前brush数量，不超过5个
            const currentBrush = tools.num_brush;
            if (currentBrush < 5) {
                rewards.push('brush'); // 第41关开始再多给一个刷子
            }
        }

        // 确保奖励道具总数不超过5个
        if (rewards.length > 5) {
            rewards = rewards.slice(0, 5);
        }

        return rewards;
    }

    /**
     * 统计奖励数量（与frm_guanka.ts中的逻辑保持一致）
     * @param rewards 奖励数组
     * @returns 奖励数量统计对象
     */
    private countRewards(rewards: string[]): { [key: string]: number } {
        const counts: { [key: string]: number } = {};
        
        rewards.forEach(rewardType => {
            counts[rewardType] = (counts[rewardType] || 0) + 1;
        });
        
        return counts;
    }

    /**
     * 添加道具到玩家道具栏
     * @param rewardType 奖励类型
     * @param count 数量
     */
    private addItemToPlayer(rewardType: string, count: number): void {
        // 通过事件系统通知主界面添加道具
        Main.DispEvent('event_add_item', { type: rewardType, count: count });
        
        // 也可以直接更新玩家数据
        // 这里假设有一个玩家数据管理器来处理道具添加
        console.log(`添加道具: ${rewardType} × ${count}`);
        if(rewardType === 'remind')
            tools.num_Remind += count;
        
        if(rewardType === 'brush')
            tools.num_brush += count;
        
        if(rewardType === 'time')
            tools.num_time += count;
    }
}