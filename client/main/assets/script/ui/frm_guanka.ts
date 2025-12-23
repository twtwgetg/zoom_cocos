import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Sprite, UITransform, Color, RichText } from 'cc';
import { frmbase } from './frmbase';
import { Main,platform } from '../main';
import { LevelMgr, GameMode } from '../levelmgr';
import { item_guank } from '../item/item_guank';
import { EntrySceneChecker } from '../EntrySceneChecker';
import { PlayerPrefb } from '../PlayerPrefb';
import { tools } from '../tools';
import { JifenRewardManager } from '../JifenRewardManager';
const { ccclass, property } = _decorator;
//declare const tt: any;
@ccclass('frm_guanka')
export class frm_guanka extends frmbase {
    
    //添加一个预制体变量，用于存放关卡预制体
    @property(Node)
    public trans_guanka: Node = null!;
    @property(Prefab)
    public prefab_guanka1: Prefab = null!;
    @property(Button)
    btn_addtodesktop: Button = null!;
    @property(Prefab)
    public prefab_sprite: Prefab = null!;
    @property(Button)
    public btn_back: Button = null!;
    @property(Label)
    public lbl_level: Label = null!;
    @property(Node)
    public trans_anis: Node = null!;
    @property(Button)
    public btn_hard: Button = null!;
    @property(Button)
    public btn_easy: Button = null!;
    @property(Button)
    public btn_wuxian: Button = null!; 
    @property(Button)
    public btn_mem: Button = null!; 
    
    @property(Button)
    public btn_layersplit: Button = null!;
    @property(Button)
    public btn_libao: Button = null!;
    @property(Button)
    public btn_lingqu: Button = null!;
    @property(Button)
    public btn_sanxiao: Button = null!;
    // 添加积分显示标签
    @property(Label)
    public lbl_jifen: Label = null!;
    @property(Sprite)
    sprite_time: Sprite = null!;
    @property(Sprite)
    sprite_brush: Sprite = null!;
    @property(Sprite)
    sprite_remind: Sprite = null!;
    @property(Prefab)
    prefab_item: Prefab = null!;
    // 添加积分奖励相关节点
    @property(Node)
    node_jifen_reward: Node = null!;
    @property(RichText)
    lbl_jifen_reward_desc: RichText = null!;
    @property(Button)
    btn_get_jifen_reward: Button = null!;
    // 添加奖励道具显示节点
    @property(Node)
    trans_items: Node = null!;
    
    start() {
        if(Main.plat == platform.WECHAT){
            this.btn_libao.node.active = false;
            this.btn_lingqu.node.active = false;
        }
        this.btn_layersplit.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_play_layersplit");
        }, this);
        this.btn_addtodesktop.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_addtodesktop");
        }, this);
        this.btn_back.node.on(Button.EventType.CLICK, ()=>{
            Main.DispEvent('game_begin');
        }, this);
        this.btn_hard.node.on(Button.EventType.CLICK, ()=>{
            LevelMgr.gameMode = GameMode.HARD;
            this.updateModeButtons();
            Main.DispEvent('event_play',LevelMgr.level);
        }, this);
        this.btn_easy.node.on(Button.EventType.CLICK, ()=>{
            LevelMgr.gameMode = GameMode.EASY;
            this.updateModeButtons();
            Main.DispEvent('event_play',LevelMgr.level);
        }, this);
        // 添加无限模式按钮点击事件
        this.btn_wuxian.node.on(Button.EventType.CLICK, ()=>{
            // 进入无限模式
            Main.DispEvent('event_play_infinite');
        }, this);
        this.btn_mem.node.on(Button.EventType.CLICK, ()=>{
            // 进入会员模式
            Main.DispEvent('event_play_mem');
        }, this);
        // 添加三消模式按钮点击事件
        this.btn_sanxiao.node.on(Button.EventType.CLICK, ()=>{
            // 进入三消模式
            Main.DispEvent('event_play_sanxiao');
        }, this);
        // 添加积分奖励按钮点击事件
        this.btn_get_jifen_reward.node.on(Button.EventType.CLICK, ()=>{
            this.claimJifenReward();
        }, this);
        //this.fillGuanKa();
        this.brushGuanKa();
        this.updateModeButtons();
        // 更新积分显示
        this.updateJifenLabel();
    }
    /**
     * 更新模式按钮状态
     */
    updateModeButtons() {
        // 根据当前模式设置按钮状态
        if (LevelMgr.gameMode === GameMode.EASY) {
            // 简单模式，高亮简单按钮
            this.btn_easy.node.getComponent(Sprite)!.color = new Color(0, 255, 0, 255); // 绿色
            this.btn_hard.node.getComponent(Sprite)!.color = new Color(255, 255, 255, 255); // 白色
        } else {
            // 困难模式，高亮困难按钮
            this.btn_hard.node.getComponent(Sprite)!.color = new Color(255, 0, 0, 255); // 红色
            this.btn_easy.node.getComponent(Sprite)!.color = new Color(255, 255, 255, 255); // 白色
        }
    }

    /**
     *  设置当前关卡
     */
    brushGuanKa() { 
        // 清空之前的关卡显示
        this.trans_anis.removeAllChildren();
        this.lbl_level.string = "当前关卡：" + (LevelMgr.level + 1);
        let count = LevelMgr.getCount(LevelMgr.level) ;
        for(let i = 0; i < count; i++) {
            var nx = instantiate(this.prefab_sprite);
            //nx.setPosition(i*20,0);
            this.trans_anis.addChild(nx);
            nx.getComponent(Sprite).spriteFrame = Main.DispEvent('event_getsprite',LevelMgr.level+1+i);
        }
    }

    fillGuanKa() {
        var all=Main.DispEvent('event_getallsprites');
        for(var i=0;i<LevelMgr.realmaxlevel;i++)
        {
            var node=instantiate(this.prefab_guanka1);
            node.name=all[i];
            node.getComponent(item_guank).setLevel(i);
            node.setPosition(-431.5035,0);
            this.trans_guanka.addChild(node);
        }

        //设置trans_guanka的高度为关卡数量乘以预制体的高度
        //设置trans_guanka的高度为关卡数量乘以预制体的高度
        const uiTransform = this.trans_guanka.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(0, all.length * this.prefab_guanka1.data.getComponent(UITransform)?.height || 0);
        }
        this.trans_guanka.setPosition(0, 0); 
    }
    
    /**
     * 更新积分标签显示
     */
    private updateJifenLabel() {
        if (this.lbl_jifen) {
            // 从本地存储加载积分
            const jifen = PlayerPrefb.getInt("jifen", 0);
            this.lbl_jifen.string = "积分: " + jifen;
        }
    }
    
    protected OnShow(): void {
        super.OnShow();
        this.brushlibao();
        this.updateModeButtons();
        // 更新积分显示
        this.updateJifenLabel();
        // 不再显示关卡等级奖励，显示积分奖励预览
        // this.showLevelRewards();
        this.showJifenRewardPreview();
        // 刷新关卡UI
        this.refreshLevelUI();
        // 显示积分奖励
        this.showJifenReward();
    }
    
    /**
     * 刷新关卡UI
     */
    private refreshLevelUI() {
        // 重新设置当前关卡显示
        this.brushGuanKa();
        
        // 更新关卡标签
        this.lbl_level.string = "当前关卡：" + (LevelMgr.level + 1);
        
        // 重新填充关卡列表（如果需要）
        // this.fillGuanKa();
    }

    brushlibao(): void { 
        if(Main.plat == platform.BYTE) {
            this.btn_libao.node.active = !EntrySceneChecker.isFromSidebar;
            this.btn_lingqu.node.active = EntrySceneChecker.isFromSidebar;
        } 
    }

    protected onLoad(): void {
        super.onLoad();
        this.btn_libao.node.active = false;
        this.btn_lingqu.node.active = false; 
        Main.RegistEvent("event_begin",(x)=>{
            this.show();
            // 更新积分显示
            this.updateJifenLabel();
            return null;
        });
        Main.RegistEvent("event_inited",(x)=>{ 
            this.brushGuanKa();
            return null;
        });
        Main.RegistEvent("game_begin",(x)=>{
            this.hide();
            return null;
        });
        Main.RegistEvent("event_play_infinite",(x)=>{
            this.hide();
            return null;
        })
        Main.RegistEvent("event_play_mem",(x)=>{
            this.hide();
            return null;
        })
        Main.RegistEvent("event_play_layersplit",(x)=>{
            this.hide();
            return null;
        })
        Main.RegistEvent("event_play_sanxiao",(x)=>{
            this.hide();
            return null;
        }); 
        Main.RegistEvent("event_play",(x)=>{
            this.hide();
            return null;
        });
        Main.RegistEvent("event_lingqu",(x)=>{ 
            if(Main.plat==platform.BYTE){ 
                this.btn_lingqu.node.active = false;
                this.btn_libao.node.active = false;
            }
            return null;
        });
        Main.RegistEvent("event_enterbrush",(x)=>{ 
            this.brushlibao();
        });
        this.btn_libao.node.on(Button.EventType.CLICK, ()=>{
            
            Main.DispEvent('event_cebianlan',false);
        }, this);
        this.btn_lingqu.node.on(Button.EventType.CLICK, ()=>{
            
            Main.DispEvent('event_cebianlan',true);
        }, this);
    }

    update(deltaTime: number) {
        
    }

    /**
     * 根据关卡获取奖励道具类型
     * @param level 关卡数
     * @returns 奖励道具类型数组
     */
    private getLevelRewards(level: number): string[] {
        // 定义所有可能的奖励类型
        const allRewards = ['remind', 'brush', 'time'];
        
        // 随机选择1到3种奖励类型
        const numRewardTypes = Math.floor(Math.random() * 3) + 1; // 1到3之间
        const selectedRewards: string[] = [];
        
        // 创建一个副本用于随机选择
        const availableRewards = [...allRewards];
        
        // 随机打乱数组
        for (let i = availableRewards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableRewards[i], availableRewards[j]] = [availableRewards[j], availableRewards[i]];
        }
        
        // 选择指定数量的奖励类型
        for (let i = 0; i < numRewardTypes; i++) {
            selectedRewards.push(availableRewards[i]);
        }
        
        // 为每种选中的奖励类型添加1到2个奖励
        const rewards: string[] = [];
        selectedRewards.forEach(rewardType => {
            const count = Math.floor(Math.random() * 2) + 1; // 1到2之间
            for (let i = 0; i < count; i++) {
                rewards.push(rewardType);
            }
        });
        
        return rewards;
    }

    /**
     * 统计奖励数量
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
     * 显示当前关卡的奖励道具
     */
    private showLevelRewards() {
        // 不再显示关卡等级奖励
        // 清空之前的奖励道具
        // this.trans_items.removeAllChildren();

        // const currentLevel = LevelMgr.level + 1;
        // let rewards = this.getLevelRewards(currentLevel);

        // 生成奖励道具
        // 统计每种奖励的数量
        // const rewardCounts = this.countRewards(rewards);

        // 生成奖励道具（每种类型只显示一个，但显示数量）
        // let index = 0;
        // 使用 Object.keys 替代 Object.entries 以兼容 ES2015
        // const keys = Object.keys(rewardCounts);
        // for (let i = 0; i < keys.length; i++) {
        //     const rewardType = keys[i];
        //     const count = rewardCounts[rewardType];
        //     const itemNode = instantiate(this.prefab_item);
        //     const itemTools = itemNode.getComponent('item_tools') as any;
            
        //     if (itemTools) {
        //         // 根据奖励类型设置道具类型
        //         let itemType = 0;
        //         switch(rewardType) {
        //             case 'remind':
        //                 itemType = 2; // ItemType.remind
        //                 break;
        //             case 'brush':
        //                 itemType = 0; // ItemType.brush
        //                 break;
        //             case 'time':
        //                 itemType = 1; // ItemType.time
        //                 break;
        //         }
                
        //         // 设置道具类型和数量
        //         itemTools.setItemType({ tp: itemType });
        //         if (itemTools.lbl_num) {
        //             itemTools.lbl_num.string = `×${count}`;
        //         }
        //     }

        //     // 设置位置
        //     const spacing = 80;
        //     const startX = -((keys.length - 1) * spacing) / 2;
        //     itemNode.setPosition(startX + index * spacing, 0);

        //     this.trans_items.addChild(itemNode);
        //     index++;
        // }
    }

    /**
     * 显示积分奖励预览
     */
    private showJifenRewardPreview() {
        // 清空之前的奖励预览
        this.trans_items.removeAllChildren();

        // 获取当前积分
        const currentJifen = PlayerPrefb.getInt("jifen", 0);
        
        // 获取下一个可领取的奖励信息
        const rewardInfo = this.getNextJifenRewardInfo(currentJifen);
        
        if (rewardInfo) {
            // 生成奖励道具预览
            // 统计每种奖励的数量
            const rewardCounts: { [key: string]: number } = {};
            rewardInfo.rewards.forEach(reward => {
                rewardCounts[reward.type] = (rewardCounts[reward.type] || 0) + reward.count;
            });

            // 生成奖励道具预览（每种类型只显示一个，但显示数量）
            let index = 0;
            // 使用 Object.keys 替代 Object.entries 以兼容 ES2015
            const keys = Object.keys(rewardCounts);
            for (let i = 0; i < keys.length; i++) {
                const rewardType = keys[i];
                const count = rewardCounts[rewardType];
                const itemNode = instantiate(this.prefab_item);
                const itemTools = itemNode.getComponent('item_tools') as any;
                
                if (itemTools) {
                    // 根据奖励类型设置道具类型
                    let itemType = 0;
                    switch(rewardType) {
                        case 'remind':
                            itemType = 2; // ItemType.remind
                            break;
                        case 'brush':
                            itemType = 0; // ItemType.brush
                            break;
                        case 'time':
                            itemType = 1; // ItemType.time
                            break;
                        case 'layer':
                            itemType = 3; // ItemType.layer
                            break;
                    }
                    
                    // 设置道具类型和数量
                    itemTools.setItemType({ tp: itemType });
                    if (itemTools.lbl_num) {
                        itemTools.lbl_num.string = `×${count}`;
                    }
                }

                // 设置位置
                const spacing = 80;
                const startX = -((keys.length - 1) * spacing) / 2;
                itemNode.setPosition(startX + index * spacing, 0);

                this.trans_items.addChild(itemNode);
                index++;
            }
        }
    }

    /**
     * 获取下一个积分奖励信息（已领取的显示下一个，未领取的显示当前可领取的）
     * @param currentJifen 当前积分
     * @returns 奖励信息或null
     */
    private getNextJifenRewardInfo(currentJifen: number): { threshold: number, rewards: { type: string, count: number }[], description: string, canClaim: boolean } | null {
        // 通过消息传递获取积分奖励信息
        return JifenRewardManager.getNextJifenRewardInfo(currentJifen);
    }

    /**
     * 显示积分奖励
     */
    private showJifenReward() {
        // 获取当前积分
        const currentJifen = PlayerPrefb.getInt("jifen", 0);
        
        // 获取下一个奖励信息
        const rewardInfo = this.getNextJifenRewardInfo(currentJifen);
        
        if (this.node_jifen_reward) {
            if (rewardInfo) {
                // 显示奖励信息
                this.node_jifen_reward.active = true;
                if (this.lbl_jifen_reward_desc) {
                    // 在描述文本中添加当前积分信息，只对积分数字部分应用颜色
                    const colorTag = rewardInfo.canClaim ? "#00FF00" : "#FF0000"; // 绿色或红色
                    let text = `${rewardInfo.description} (当前积分: <color=${colorTag}>${currentJifen}</color>)`;
                    
                    // 循环检测，每20个字符换行
                    text = this.wrapText(text, 22);
                    
                    this.lbl_jifen_reward_desc.string = text;
                }
                // 更新领取按钮状态
                if (this.btn_get_jifen_reward) {
                    this.btn_get_jifen_reward.interactable = rewardInfo.canClaim;
                }
            } else {
                // 没有奖励信息
                this.node_jifen_reward.active = false;
            }
        }
    }
    
    /**
     * 领取积分奖励
     */
    private claimJifenReward() {
        // 获取当前积分
        const currentJifen = PlayerPrefb.getInt("jifen", 0);
        
        // 获取下一个可领取的奖励
        const rewardInfo = this.getNextJifenRewardInfo(currentJifen);
        
        if (rewardInfo && rewardInfo.canClaim) {
            // 发放奖励
            rewardInfo.rewards.forEach(reward => {
                this.addItemToPlayer(reward.type, reward.count);
            });
            
            // 记录已领取的奖励
            this.markJifenRewardAsClaimed(rewardInfo.threshold);
            
            // 显示提示信息
            console.log(`领取积分奖励成功: ${rewardInfo.description}`);
            
            // 更新积分奖励显示
            this.showJifenReward();
            
            // 更新积分显示
            this.updateJifenLabel();
        }
    }
    
    /**
     * 查找合适的换行点
     * @param text 文本
     * @param maxLen 最大长度
     * @returns 换行点位置
     */
    private findBreakPoint(text: string, maxLen: number): number {
        // 如果文本长度小于等于最大长度，不需要换行
        if (text.length <= maxLen) {
            return -1;
        }
        
        // 查找最佳换行点（在空格、逗号或分号后换行）
        for (let i = maxLen; i > 0; i--) {
            const char = text.charAt(i);
            if (char === ' ' || char === ',' || char === ';' || char === ':') {
                return i + 1; // 在分隔符后换行
            }
        }
        
        // 如果找不到合适的换行点，则在最大长度处换行
        return maxLen;
    }

    /**
     * 循环换行文本
     * @param text 文本
     * @param maxLen 每行最大长度
     * @returns 处理后的文本
     */
    private wrapText(text: string, maxLen: number): string {
        // 如果文本长度小于等于最大长度，不需要换行
        if (text.length <= maxLen) {
            return text;
        }
        
        // 移除HTML标签后的纯文本
        const plainText = text.replace(/<[^>]*>/g, '');
        
        // 如果纯文本长度小于等于最大长度，不需要换行
        if (plainText.length <= maxLen) {
            return text;
        }
        
        let result = "";
        let plainIndex = 0;  // 纯文本的索引
        let originalIndex = 0;  // 原始文本的索引
        
        // 循环处理文本，每次处理一段
        while (plainIndex < plainText.length) {
            // 计算剩余纯文本长度
            const remainingPlainLength = plainText.length - plainIndex;
            
            // 如果剩余纯文本长度小于等于最大长度，直接添加剩余部分并结束
            if (remainingPlainLength <= maxLen) {
                result += text.substring(originalIndex);
                break;
            }
            
            // 获取一段纯文本（maxLen长度）
            const plainSegment = plainText.substring(plainIndex, plainIndex + maxLen);
            
            // 查找最佳换行点
            const breakPoint = this.findBreakPoint(plainSegment, maxLen);
            
            if (breakPoint > 0) {
                // 找到合适的换行点
                const plainBreakPos = plainIndex + breakPoint;
                
                // 在原始文本中找到对应的断点位置
                let originalBreakPos = originalIndex;
                let plainCharCount = 0;
                
                while (plainCharCount < breakPoint && originalBreakPos < text.length) {
                    const char = text.charAt(originalBreakPos);
                    if (char === '<') {
                        // 跳过HTML标签
                        const tagEnd = text.indexOf('>', originalBreakPos);
                        if (tagEnd !== -1) {
                            originalBreakPos = tagEnd + 1;
                        } else {
                            originalBreakPos++;
                        }
                    } else {
                        originalBreakPos++;
                        plainCharCount++;
                    }
                }
                
                // 添加文本段并换行
                result += text.substring(originalIndex, originalBreakPos) + "\n";
                originalIndex = originalBreakPos;
                plainIndex = plainBreakPos;
            } else {
                // 没有找到合适的换行点，在maxLen处强制换行
                let originalBreakPos = originalIndex;
                let plainCharCount = 0;
                
                while (plainCharCount < maxLen && originalBreakPos < text.length) {
                    const char = text.charAt(originalBreakPos);
                    if (char === '<') {
                        // 跳过HTML标签
                        const tagEnd = text.indexOf('>', originalBreakPos);
                        if (tagEnd !== -1) {
                            originalBreakPos = tagEnd + 1;
                        } else {
                            originalBreakPos++;
                        }
                    } else {
                        originalBreakPos++;
                        plainCharCount++;
                    }
                }
                
                // 添加文本段并换行
                result += text.substring(originalIndex, originalBreakPos) + "\n";
                originalIndex = originalBreakPos;
                plainIndex += maxLen;
            }
        }
        
        return result;
    }
    
    /**
     * 获取已领取的积分奖励阈值
     * @returns 已领取的阈值数组
     */
    private getClaimedJifenRewardThresholds(): number[] {
        // 通过消息传递获取已领取的积分奖励阈值
        return JifenRewardManager.getClaimedJifenRewardThresholds();
    }

    /**
     * 标记积分奖励为已领取
     * @param threshold 奖励阈值
     */
    private markJifenRewardAsClaimed(threshold: number) {
        // 通过消息传递标记积分奖励为已领取
        JifenRewardManager.markJifenRewardAsClaimed(threshold);
    }
    
    /**
     * 添加道具到玩家道具栏
     * @param rewardType 奖励类型
     * @param count 数量
     */
    private addItemToPlayer(rewardType: string, count: number): void {
        console.log(`添加道具: ${rewardType} × ${count}`);
        if(rewardType === 'remind')
            tools.num_Remind += count;
        
        if(rewardType === 'brush')
            tools.num_brush += count;
        
        if(rewardType === 'time')
            tools.num_time += count;
            
        if(rewardType === 'layer')
            tools.num_layer += count;
    }

    /**
     * 获取可领取的积分奖励
     * @param currentJifen 当前积分
     * @returns 奖励信息或null
     */
    private getAvailableJifenReward(currentJifen: number): { threshold: number, rewards: { type: string, count: number }[], description: string } | null {
        // 通过消息传递获取可领取的积分奖励
        const availableRewards = JifenRewardManager.getAvailableJifenReward(currentJifen);
        return availableRewards.length > 0 ? availableRewards[0] : null;
    }
}