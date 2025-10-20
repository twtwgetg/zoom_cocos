import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Sprite, UITransform, Color } from 'cc';
import { frmbase } from './frmbase';
import { Main,platform } from './main';
import { LevelMgr, GameMode } from './levelmgr';
import { item_guank } from './item_guank';
import { EntrySceneChecker } from './EntrySceneChecker';
import { PlayerPrefb } from './PlayerPrefb';
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
        // 添加三消模式按钮点击事件
        this.btn_sanxiao.node.on(Button.EventType.CLICK, ()=>{
            // 进入三消模式
            Main.DispEvent('event_play_sanxiao');
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
        // 显示当前关卡的奖励
        this.showLevelRewards();
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
     * 显示当前关卡的奖励道具
     */
    private showLevelRewards() {
        // 清空之前的奖励道具
        this.trans_items.removeAllChildren();

        const currentLevel = LevelMgr.level + 1;
        let rewards = this.getLevelRewards(currentLevel);

        // 生成奖励道具
        // 统计每种奖励的数量
        const rewardCounts = this.countRewards(rewards);

        // 生成奖励道具（每种类型只显示一个，但显示数量）
        let index = 0;
        for (const [rewardType, count] of Object.entries(rewardCounts)) {
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
                }
                
                // 设置道具类型和数量
                itemTools.setItemType({ tp: itemType });
                if (itemTools.lbl_num) {
                    itemTools.lbl_num.string = `×${count}`;
                }
            }

            // 设置位置
            const spacing = 80;
            const startX = -((Object.keys(rewardCounts).length - 1) * spacing) / 2;
            itemNode.setPosition(startX + index * spacing, 0);

            this.trans_items.addChild(itemNode);
            index++;
        }
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
}