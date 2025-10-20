import { _decorator, Component, Node, Vec3, tween, SpriteFrame, Sprite, UITransform, Button } from 'cc';
import { Main } from './main';
import { TObject } from './TObject';

const { ccclass, property } = _decorator;

@ccclass('LayerSplitManager')
export class LayerSplitManager extends Component {
    // 羊了个羊容器（最多放9个卡槽）
    @property(Node)
    public ylgyContainer: Node = null!;

    // 容器中的卡牌节点数组
    private containerCards: Node[] = [];
    
    // 恢复容器容量为7个
    private MAX_CONTAINER_SIZE: number = 7;
    
    // 当前关卡
    private currentLevel: number = 0;
    
    // 卡牌精灵帧数组
    private plSprites: SpriteFrame[] = [];
    
    // 卡槽节点数组（1-7号卡槽）
    private slotNodes: Node[] = [];

    onLoad() {
        // 注册相关事件
        this.registerEvents();
    }

    start() {
        // 初始化时隐藏 ylgyContainer
        try {
            Main.DispEvent('event_show_ylgy_container', false);
        } catch (error) {
            console.error('隐藏容器时出错:', error);
        }
    }
    
    /**
     * 初始化卡槽节点
     */
    private initSlotNodes() {
        // 添加保护性检查
        if (!this.ylgyContainer) {
            console.warn('ylgyContainer 未初始化');
            return;
        }
        
        this.slotNodes = [];
        const containerContent = this.ylgyContainer;
        
        // 获取1-7号卡槽节点
        for (let i = 1; i <= 7; i++) {
            const slotNode = containerContent.getChildByName(i.toString());
            // 添加保护性检查
            if (slotNode && slotNode.isValid) {
                this.slotNodes.push(slotNode);
            } else {
                console.warn(`未找到卡槽节点: ${i}`);
            }
        }
        
        console.log(`成功初始化 ${this.slotNodes.length} 个卡槽节点`);
    }
    
    /**
     * 注册事件监听
     */
    private registerEvents() {
        // 开始叠加拆分模式游戏
        Main.RegistEvent('event_play_layersplit', (level) => {
            this.startLayerSplitGame(level); 
            return null;
        });
        Main.RegistEvent('event_show_ylgy_container', (acitve) => {
            this.ylgyContainer.active = acitve;
            return null;
        });
        // 卡牌被点击并移动到容器
        Main.RegistEvent('event_move_to_container', (card) => {
            if (card && card instanceof Node) {
                this.moveToContainer(card);
            } else {
                console.warn('无效的卡牌参数:', card);
            }
            return null;
        });
        
        // 获取卡牌精灵帧
        Main.RegistEvent('event_get_plsprites', () => {
            return this.plSprites || [];
        });
        
        // 检查网格中是否还有卡牌
        Main.RegistEvent('event_has_cards_in_grid', () => {
            try {
                // 这里需要获取网格中的卡牌数量
                // 由于我们没有直接访问网格的引用，我们可以通过事件获取
                const gridChildren = Main.DispEvent('event_get_grid_children');
                return gridChildren && Array.isArray(gridChildren) && gridChildren.length > 0;
            } catch (error) {
                console.error('检查网格中卡牌时出错:', error);
                return false;
            }
        });
        
        // 处理[layerSplit](file:///c:/Users/Administrator/zoom_cocos/client/main/assets/script/frm_guanka.ts#L27-L27)模式中卡牌的点击事件
        Main.RegistEvent('event_card_clicked_layer_split', (cardNode) => {
            // 将卡牌移动到容器中
            if (cardNode && cardNode instanceof Node) {
                this.moveToContainer(cardNode);
            } else {
                console.warn('无效的卡牌节点参数:', cardNode);
            }
            return null;
        });
        
        // 处理清除道具使用事件
        Main.RegistEvent('event_layer_clear', () => {
            this.handleLayerClear();
            return null;
        });
    }
    
    /**
     * 开始叠加拆分模式游戏
     * @param level 关卡编号
     */
    private startLayerSplitGame(level: number) {
        this.currentLevel = level;
        
        // 清空容器
        this.clearContainer();
        
        // 初始化卡槽节点
        this.initSlotNodes();
        
        // 获取卡牌精灵帧
        try {
            this.plSprites = Main.DispEvent('EVENT_GETPLSPRITES') || [];
        } catch (error) {
            console.error('获取卡牌精灵帧时出错:', error);
            this.plSprites = [];
        }
        
        // 通知主场景显示 ylgyContainer
        try {
            Main.DispEvent('event_show_ylgy_container', true);
        } catch (error) {
            console.error('显示容器时出错:', error);
        }
        
        console.log(`开始叠加拆分模式游戏，关卡: ${level + 1}`);
    }
    
    /**
     * 将卡牌移动到容器
     * @param card 要移动的卡牌
     */
    private moveToContainer(card: Node) {
        // 添加保护性检查，确保卡牌节点仍然有效
        if (!card || !card.isValid) {
            console.warn('试图移动无效的卡牌节点');
            return;
        }
        
        // 检查容器是否已满
        if (this.containerCards.length >= this.MAX_CONTAINER_SIZE) {
            // 容器已满，游戏失败
            console.log('容器已满，游戏失败！');
            
            // 清空所有卡牌
            this.clearAllCards();
            
            // 通知主场景隐藏 ylgyContainer
            try {
                Main.DispEvent('event_show_ylgy_container', false);
                Main.DispEvent('game_lose_layersplit');
            } catch (error) {
                console.error('触发游戏失败事件时出错:', error);
            }
            return;
        }
        
        // 将卡牌添加到容器数组
        this.containerCards.push(card);
        
        // 禁用卡牌的点击事件
        const button = card.getComponent(Button);
        if (button) {
            button.enabled = false;
        }
        
        // 确保卡槽节点已初始化
        if (this.slotNodes.length === 0) {
            this.initSlotNodes();
        }
        
        // 计算目标卡槽位置（1-7号卡槽）
        const slotIndex = this.containerCards.length <= 7 ? this.containerCards.length - 1 : Math.floor(Math.random() * 7);
        // 添加保护性检查
        if (slotIndex < 0 || slotIndex >= this.slotNodes.length) {
            console.warn('无效的卡槽索引:', slotIndex);
            // 从容器中移除卡牌，因为移动失败了
            this.containerCards = this.containerCards.filter(c => c !== card);
            return;
        }
        
        const targetSlot = this.slotNodes[slotIndex];
        
        // 添加保护性检查
        if (targetSlot && targetSlot.isValid) {
            // 直接移动卡牌到目标卡槽
            this.playMoveToSlotAnimation(card, targetSlot);
        } else {
            // 如果找不到指定卡槽，使用原来的线性排列方式
            // 添加保护性检查
            if (!this.ylgyContainer) {
                console.warn('ylgyContainer 未初始化');
                // 从容器中移除卡牌，因为移动失败了
                this.containerCards = this.containerCards.filter(c => c !== card);
                return;
            }
            
            // 计算目标位置（线性排列）
            const targetPosition = this.calculateTargetPosition(this.containerCards.length - 1);
            
            // 直接移动卡牌到目标位置
            this.playMoveToContainerAnimation(card, targetPosition);
        }
    }
    
    /**
     * 计算目标位置（线性排列）
     * @param index 容器中卡牌的索引
     */
    private calculateTargetPosition(index: number): Vec3 {
        // 添加保护性检查
        if (!this.ylgyContainer) {
            console.warn('ylgyContainer 未初始化');
            return Vec3.ZERO;
        }
        
        // 获取容器的UITransform组件
        const containerTransform = this.ylgyContainer.getComponent(UITransform);
        if (!containerTransform) {
            console.warn('无法获取容器的UITransform组件');
            return Vec3.ZERO;
        }
        
        // 计算卡牌的尺寸
        const cardWidth = 80;  // 假设卡牌宽度为80
        const cardHeight = 80; // 假设卡牌高度为80
        const spacing = 10;    // 卡牌间距
        
        // 计算起始位置（居中排列）
        // 修复：确保使用当前容器中卡牌的数量而不是固定值
        const currentCardCount = this.containerCards.length;
        // 添加保护性检查
        if (currentCardCount <= 0) {
            return Vec3.ZERO;
        }
        
        const totalWidth = currentCardCount * cardWidth + (currentCardCount - 1) * spacing;
        const startX = (containerTransform.width - totalWidth) / 2;
        
        // 计算目标位置
        // 添加保护性检查
        if (index < 0 || index >= currentCardCount) {
            console.warn('无效的卡牌索引:', index);
            return Vec3.ZERO;
        }
        
        // 计算相对于容器中心的位置
        const x = startX + index * (cardWidth + spacing) + cardWidth / 2 - containerTransform.width / 2;
        const y = 0; // 垂直居中对齐
        
        return new Vec3(x, y);
    }
    
    /**
     * 播放移动到容器的动画
     * @param card 要移动的卡牌节点
     * @param targetPosition 目标位置
     */
    private playMoveToContainerAnimation(card: Node, targetPosition: Vec3) {
        // 添加保护性检查，确保卡牌节点仍然有效
        if (!card || !card.isValid) {
            console.warn('试图播放移动动画的卡牌节点无效');
            return;
        }
        
        try {
            // 获取卡牌的UITransform组件
            const cardTransform = card.getComponent(UITransform);
            if (!cardTransform) {
                console.warn('无法获取卡牌的UITransform组件');
                return;
            }
            
            // 获取卡牌的Sprite组件
            const cardSprite = card.getComponent(Sprite);
            if (!cardSprite) {
                console.warn('无法获取卡牌的Sprite组件');
                return;
            }
            
            // 获取原始尺寸
            const originalSize = cardTransform.contentSize.clone();
            
            // 计算目标尺寸（假设目标尺寸为60x60）
            const targetSize = { width: 60, height: 60 };
            
            // 计算缩放比例
            const scale = new Vec3(
                targetSize.width / originalSize.width,
                targetSize.height / originalSize.height,
                1
            );
            
            // 使用动画移动到目标位置和缩放
            tween(card)
                .to(0.3, { position: targetPosition, scale: scale }, { easing: 'sineOut' })
                .call(() => {
                    // 动画完成后检查消除条件
                    console.log('卡牌移动到容器完成');
                    if (card && card.isValid && this.node && this.node.isValid) {
                        // 不需要将卡牌设置为容器的子节点，只需要视觉上看起来落到了目标位置
                        // 检查是否满3个相同的卡牌
                        this.checkForElimination();
                        
                        // 检查是否卡槽已满且没有可消除的卡牌
                        this.checkGameLoseCondition();
                    } else {
                        console.warn('卡牌或LayerSplitManager节点已无效，无法检查消除条件');
                    }
                })
                .start();
        } catch (error) {
            console.error('播放移动到容器动画时出错:', error);
        }
    }
    
    /**
     * 播放移动到指定卡槽的动画
     * @param card 要移动的卡牌节点
     * @param targetSlot 目标卡槽节点
     */
    private playMoveToSlotAnimation(card: Node, targetSlot: Node) {
        // 添加保护性检查
        if (!card || !card.isValid || !targetSlot || !targetSlot.isValid) {
            console.warn('无效的卡牌或目标卡槽节点');
            return;
        }
        
        try {
            // 获取目标卡槽的世界坐标位置
            const targetWorldPosition = targetSlot.worldPosition.clone();
            
            // 获取卡牌父节点的世界坐标位置
            if (!card.parent) {
                console.warn('卡牌没有父节点');
                return;
            }
            
            const parentWorldPosition = card.parent.worldPosition.clone();
            
            // 计算相对位置（目标位置相对于卡牌父节点的位置）
            const targetPosition = new Vec3(
                targetWorldPosition.x - parentWorldPosition.x,
                targetWorldPosition.y - parentWorldPosition.y,
                targetWorldPosition.z - parentWorldPosition.z
            );
            
            // 获取目标卡槽的尺寸
            const targetTransform = targetSlot.getComponent(UITransform);
            if (!targetTransform) {
                console.warn('无法获取目标卡槽的UITransform组件');
                return;
            }
            
            // 获取卡牌的UITransform组件
            const cardTransform = card.getComponent(UITransform);
            if (!cardTransform) {
                console.warn('无法获取卡牌的UITransform组件');
                return;
            }
            
            // 获取原始尺寸
            const originalSize = cardTransform.contentSize.clone();
            const targetSize = targetTransform.contentSize.clone();
            
            // 计算缩放比例
            const scale = new Vec3(
                targetSize.width / originalSize.width,
                targetSize.height / originalSize.height,
                1
            );
            
            // 使用动画移动到目标位置和缩放
            tween(card)
                .to(0.3, { position: targetPosition, scale: scale }, { easing: 'sineOut' })
                .call(() => {
                    // 动画完成后检查消除条件
                    console.log('卡牌移动到卡槽完成');
                    if (this.node && this.node.isValid) {
                        // 修复：不需要将卡牌设置为目标的子节点，只需要视觉上看起来落到了目标位置
                        // 检查是否满3个相同的卡牌
                        this.checkForElimination();
                        
                        // 检查是否卡槽已满且没有可消除的卡牌
                        this.checkGameLoseCondition();
                    } else {
                        console.warn('LayerSplitManager节点已无效，无法检查消除条件');
                    }
                })
                .start();
        } catch (error) {
            console.error('播放移动到卡槽动画时出错:', error);
        }
    }
    
    /**
     * 检查游戏失败条件
     */
    private checkGameLoseCondition() {
        // 检查是否卡槽已满且没有可消除的卡牌
        if (this.containerCards.length >= this.MAX_CONTAINER_SIZE && !this.hasEliminableCards()) {
            // 容器已满且没有可消除的卡牌，游戏失败
            console.log('容器已满且没有可消除的卡牌，游戏失败！');
            
            // 清空所有卡牌
            this.clearAllCards();
            
            // 通知主场景隐藏 ylgyContainer
            try {
                Main.DispEvent('event_show_ylgy_container', false);
                Main.DispEvent('game_lose_layersplit');
            } catch (error) {
                console.error('触发游戏失败事件时出错:', error);
            }
        }
    }
    
    /**
     * 检查是否有可消除的卡牌
     */
    private hasEliminableCards(): boolean {
        // 添加保护性检查
        if (!this.containerCards || this.containerCards.length === 0) {
            return false;
        }
        
        // 按卡牌类型分组
        const cardGroups: { [key: number]: Node[] } = {};
        
        // 遍历容器中的卡牌
        for (let i = 0; i < this.containerCards.length; i++) {
            // 添加保护性检查，确保索引有效
            if (i >= this.containerCards.length) {
                continue;
            }
            
            const card = this.containerCards[i];
            // 添加保护性检查
            if (!card || !card.isValid) {
                continue;
            }
            
            const tobj = card.getComponent(TObject);
            if (tobj) {
                const type = tobj.type;
                if (!cardGroups[type]) {
                    cardGroups[type] = [];
                }
                cardGroups[type].push(card);
            }
        }
        
        // 检查是否有满3个的类型
        for (const type in cardGroups) {
            // 添加保护性检查
            if (!cardGroups[type]) {
                continue;
            }
            
            const cards = cardGroups[type];
            // 添加保护性检查
            if (!cards || !Array.isArray(cards) || cards.length === undefined) {
                console.warn('卡牌数组无效:', cards);
                continue;
            }
            
            if (cards.length >= 3) {
                // 有可消除的卡牌
                return true;
            }
        }
        
        // 没有可消除的卡牌
        return false;
    }
    
    /**
     * 检查是否满3个相同的卡牌并消除
     */
    private checkForElimination() {
        // 添加保护性检查
        if (!this.containerCards || this.containerCards.length === 0) {
            return;
        }
        
        // 按卡牌类型分组
        const cardGroups: { [key: number]: Node[] } = {};
        
        // 遍历容器中的卡牌
        for (let i = 0; i < this.containerCards.length; i++) {
            // 添加保护性检查，确保索引有效
            if (i >= this.containerCards.length) {
                continue;
            }
            
            const card = this.containerCards[i];
            // 添加保护性检查
            if (!card || !card.isValid) {
                continue;
            }
            
            const tobj = card.getComponent(TObject);
            if (tobj) {
                const type = tobj.type;
                if (!cardGroups[type]) {
                    cardGroups[type] = [];
                }
                cardGroups[type].push(card);
            }
        }
        
        // 检查是否有满3个的类型
        for (const type in cardGroups) {
            // 添加保护性检查
            if (!cardGroups[type]) {
                continue;
            }
            
            const cards = cardGroups[type];
            // 添加保护性检查
            if (!cards || !Array.isArray(cards) || cards.length === undefined) {
                console.warn('卡牌数组无效:', cards);
                continue;
            }
            
            if (cards.length >= 3) {
                // 消除这3个卡牌
                this.eliminateCards(cards.slice(0, 3));
                return; // 一次只消除一组
            }
        }
    }
    
    /**
     * 消除指定的卡牌
     * @param cards 要消除的卡牌数组
     */
    private eliminateCards(cards: Node[]) {
        // 添加保护性检查
        if (!cards || cards.length === 0) {
            console.warn('试图消除空的卡牌数组');
            return;
        }
        
        // 显示分数弹出效果
        for (const card of cards) {
            // 添加保护性检查，确保卡牌节点仍然有效
            if (card && card.isValid) {
                try {
                    // 记录消除位置
                    const eliminatePos = card.position.clone();
                    // 显示分数提示
                    Main.DispEvent('event_show_score_popup', eliminatePos);
                } catch (error) {
                    console.warn('显示分数提示时出错:', error);
                }
            }
        }
        
        // 从容器中移除这些卡牌
        this.containerCards = this.containerCards.filter(card => cards.indexOf(card) === -1);
        
        // 直接销毁卡牌，不使用动画
        for (const card of cards) {
            // 添加保护性检查，确保卡牌节点仍然有效
            if (card && card.isValid) {
                try {
                    card.destroy();
                } catch (error) {
                    console.warn('销毁卡牌时出错:', error);
                }
            } else {
                console.warn('试图消除无效的卡牌节点');
            }
        }
        
        // 触发积分增加事件
        try {
            Main.DispEvent('event_add_jifen', cards.length);
        } catch (error) {
            console.error('触发积分增加事件时出错:', error);
        }
        
        // 重新排列剩余卡牌
        this.rearrangeCards();
        
        // 检查游戏是否胜利
        this.checkGameWin();
    }
    
    /**
     * 检查游戏是否胜利
     */
    private checkGameWin() {
        // 如果容器为空且网格中没有卡牌，则游戏胜利
        if (this.containerCards.length === 0) {
            // 添加保护性检查
            try {
                // 修复：在分层叠加模式下，需要检查地图中是否还有卡牌
                const hasCardsInGrid = Main.DispEvent('event_has_cards_in_grid');
                // 添加保护性检查
                if (hasCardsInGrid !== undefined && !hasCardsInGrid) {
                    console.log('分层叠加模式游戏胜利！');
                    // 通知主场景隐藏 ylgyContainer
                    Main.DispEvent('event_show_ylgy_container', false);
                    // 触发游戏胜利事件
                    Main.DispEvent('game_win_layersplit');
                }
            } catch (error) {
                console.error('检查游戏胜利条件时出错:', error);
            }
        }
    }
    
    /**
     * 重新排列容器中的卡牌
     */
    private rearrangeCards() {
        // 添加保护性检查
        if (!this.ylgyContainer) {
            console.warn('ylgyContainer 未初始化，无法重新排列卡牌');
            return;
        }
        
        // 重新计算每个卡牌的位置
        for (let i = 0; i < this.containerCards.length; i++) {
            const card = this.containerCards[i];
            // 添加保护性检查，确保卡牌节点仍然有效
            if (card && card.isValid) {
                //const targetPosition = this.calculateTargetPosition(i);
                
                // 直接设置位置，不使用动画
                //card.setPosition(targetPosition);


                const targetSlot = this.slotNodes[i]; 
                this.playMoveToSlotAnimation(card, targetSlot);

            } else {
                console.warn('试图移动无效的卡牌节点');
            }
        }
    }
    
    /**
     * 清空容器
     */
    private clearContainer() {
        try {
            // 销毁所有容器中的卡牌
            if (this.containerCards && Array.isArray(this.containerCards)) {
                for (const card of this.containerCards) {
                    // 添加保护性检查，确保卡牌节点仍然有效
                    if (card && card.isValid) {
                        try {
                            card.destroy();
                        } catch (error) {
                            console.warn('销毁卡牌时出错:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('清空容器时出错:', error);
        }
        
        // 清空数组
        this.containerCards = [];
    }
    
    /**
     * 清空所有卡牌
     */
    private clearAllCards() {
        // 清空容器中的卡牌
        try {
            // 销毁所有容器中的卡牌
            if (this.containerCards && Array.isArray(this.containerCards)) {
                for (const card of this.containerCards) {
                    // 添加保护性检查，确保卡牌节点仍然有效
                    if (card && card.isValid) {
                        try {
                            card.destroy();
                        } catch (error) {
                            console.warn('销毁卡牌时出错:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('清空容器卡牌时出错:', error);
        }
        
        // 清空数组
        this.containerCards = [];
        
        // 通知网格创建器清空卡牌
        try {
            Main.DispEvent('event_clear_grid_cards');
        } catch (error) {
            console.error('通知清空网格卡牌时出错:', error);
        }
    }
    
    /**
     * 处理清除道具使用事件
     * 在层级叠加模式下，使用清除道具会从卡池中找到对应的卡牌并消除卡槽中的所有卡牌
     */
    private handleLayerClear() {
        console.log('使用清除道具，开始处理卡槽中的卡牌');
        
        // 检查是否处于层级叠加模式
        if (!this.ylgyContainer.active) {
            console.warn('当前不处于层级叠加模式，无法使用清除道具');
            return;
        }
        
        // 统计卡槽中每种卡牌类型的数量
        const containerCardTypeCounts: { [type: number]: number } = {};
        for (const card of this.containerCards) {
            if (card && card.isValid) {
                const tobj = card.getComponent('TObject') as TObject | null;
                if (tobj) {
                    const type = tobj.type;
                    if (!containerCardTypeCounts[type]) {
                        containerCardTypeCounts[type] = 0;
                    }
                    containerCardTypeCounts[type]++;
                }
            }
        }
        
        // 如果卡槽中没有卡牌，直接返回
        if (Object.keys(containerCardTypeCounts).length === 0) {
            console.log('卡槽中没有卡牌，无需处理');
            return;
        }
        
        // 计算每种类型还需要多少张卡牌才能凑够3个
        const cardsNeeded: { [type: number]: number } = {};
        for (const typeStr in containerCardTypeCounts) {
            const type = parseInt(typeStr);
            const currentCount = containerCardTypeCounts[type];
            // 如果当前数量小于3，则需要补充到3个
            if (currentCount < 3) {
                cardsNeeded[type] = 3 - currentCount;
            }
        }
        
        // 如果所有类型都已经有3个或以上，直接返回
        const neededTypes = Object.keys(cardsNeeded);
        if (neededTypes.length === 0) {
            console.log('所有卡牌类型都已经有3个或以上，无需补充');
            return;
        }
        
        // 从卡池中找到需要的卡牌
        try {
            // 获取网格中的所有卡牌节点
            const gridChildren = Main.DispEvent('event_get_grid_children') as Node[] | null;
            if (gridChildren && Array.isArray(gridChildren)) {
                // 为每种类型存储可消除的卡牌
                const cardsToEliminateByType: { [type: number]: Node[] } = {};
                
                // 初始化每种类型需要的卡牌数组
                for (const typeStr in cardsNeeded) {
                    const type = parseInt(typeStr);
                    cardsToEliminateByType[type] = [];
                }
                
                // 遍历网格中的卡牌
                for (const child of gridChildren) {
                    if (child && child.isValid) {
                        const tobj = child.getComponent('TObject') as TObject | null;
                        if (tobj) {
                            const type = tobj.type;
                            // 检查该卡牌类型是否是我们需要的
                            if (cardsNeeded[type] && cardsToEliminateByType[type]) {
                                // 如果该类型还需要更多卡牌，则添加到待消除列表
                                if (cardsToEliminateByType[type].length < cardsNeeded[type]) {
                                    cardsToEliminateByType[type].push(child);
                                }
                            }
                        }
                    }
                }
                
                // 消除找到的卡牌
                let totalEliminated = 0;
                for (const typeStr in cardsToEliminateByType) {
                    const type = parseInt(typeStr);
                    const cardsToEliminate = cardsToEliminateByType[type];
                    
                    if (cardsToEliminate.length > 0) {
                        console.log(`找到${cardsToEliminate.length}张类型为${type}的卡牌`);
                        
                        // 消除这些卡牌
                        for (const card of cardsToEliminate) {
                            if (card && card.isValid) {
                                // 显示分数弹出效果
                                const eliminatePos = card.position.clone();
                                Main.DispEvent('event_show_score_popup', eliminatePos);
                                
                                // 销毁卡牌
                                card.destroy();
                                totalEliminated++;
                            }
                        }
                    }
                }
                
                if (totalEliminated > 0) {
                    // 触发积分增加事件（每张卡牌加1分）
                    Main.DispEvent('event_add_jifen', totalEliminated);
                    
                    // 通知整理卡牌
                    Main.DispEvent('event_zhengli');
                    
                    console.log(`成功消除${totalEliminated}张卡牌`);
                } else {
                    console.log('没有找到需要的卡牌');
                }
            }
        } catch (error) {
            console.error('从卡池中查找并消除卡牌时出错:', error);
        }
        
        // 清空卡槽中的所有卡牌
        this.clearContainer();
        
        console.log('清除道具使用完成');
    }
}