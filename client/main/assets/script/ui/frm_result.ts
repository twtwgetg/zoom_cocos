import { _decorator, Button, Component, EditBox, Input, Label, Node, Color, RichText, Prefab, instantiate, SpriteFrame, Sprite, UITransform } from 'cc';
import { Main } from '../main';
import { LevelMgr, GameMode } from '../levelmgr';
import { frmbase } from './frmbase';
import { PlayerPrefb } from '../PlayerPrefb';
import { frm_main } from './frm_main';
import { ToutiaoEventMgr } from '../ToutiaoEventMgr';
import { tools } from '../tools';
import { JifenRewardManager } from '../JifenRewardManager';
const { ccclass, property } = _decorator;

@ccclass('frm_result')
export class frm_result extends frmbase {
    @property(Button)
    btn_again_faild: Button = null!;
    @property(Button)
    btn_menu_faild: Button = null!;

    @property(Button)
    btn_again_win: Button = null!;
    @property(Button)
    btn_menu_win: Button = null!;


    @property(Button)
    btn_nextlevel: Button = null!;
    level_played: number = 0;
    @property(Node)
    sucess: Node = null!;
    @property(Node)
    faild: Node = null!;
    @property(Label)
    level_suc: Label = null!;
    @property(Label)
    level_faild: Label = null!;

    // 添加模式标签
    @property(Label)
    lbl_mode_suc: Label = null!;
    @property(Label)
    lbl_mode_faild: Label = null!;

    @property(Node)
    star_1: Node = null!;
    @property(Node)
    star_2: Node = null!;
    @property(Node)
    star_3: Node = null!;

    @property(Label)
    lbl_soruce_faild: Label = null!;
    // @property(Label)
    // lbl_source_suc: Label = null!;

    // 添加积分相关属性
    @property(Label)
    lbl_jifen_suc: Label = null!; // 胜利界面积分标签
    @property(RichText)
    lbl_jifen_reward_desc:RichText  = null!; // 积分奖励描述标签
    @property(Button)
    btn_get_jifen_reward: Button = null!; // 领取积分奖励按钮
    @property(Node)
    node_jifen_reward: Node = null!; // 积分奖励节点

    // 添加奖励道具显示相关属性
    @property(Prefab)
    prefab_item: Prefab = null!; // 道具预制体
    @property(Node)
    trans_items: Node = null!; // 奖励道具显示节点

    // 添加精灵帧属性（用于道具显示）
    @property(SpriteFrame)
    sprite_time: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_brush: SpriteFrame = null!;
    @property(SpriteFrame)
    sprite_remind: SpriteFrame = null!;
    private resultButtonsReady: boolean = false;
    private faildViewReady: boolean = false;
    private faildHintLabel: Label | null = null;
    private faildScoreTitleLabel: Label | null = null;
    private faildProgressText: RichText | null = null;

    //转成千位进制表示法
    formatNumber(num: number): string {
        // 保存符号
        const isNegative = num < 0;

        // 取绝对值并取整
        num = Math.abs(Math.floor(num));

        // 转为字符串并添加千位分隔符
        let result = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        // 如果原数是负数，添加负号
        if (isNegative) {
            result = "-" + result;
        }

        return result;
    }
    /**
     * 显示下一关按钮
     */
    ShowNextlevel(){
        if(this.level_played < 0 || this.level_played >= LevelMgr.realmaxlevel - 1){
            // 非闯关模式，没有下一关
            this.btn_nextlevel.node.active = false;
        }
        else{
            this.btn_nextlevel.node.active = true;
        }
    }
    /**
     * 显示时处理逻辑
     */
    protected OnShow(): void {
        //先隐藏按钮，待广告播放完毕或关闭广告后显示

        let ret = Main.DispEvent("event_play_interstitialAd", this);
        if (ret) {
            this.scheduleOnce(() => {
                this.btn_again_faild.node.active = true;
                this.btn_menu_faild.node.active = true;
                this.btn_again_win.node.active = true;
                this.btn_menu_win.node.active = true;
                this.ShowNextlevel();
                this.resultButtonsReady = true;
                this.checkGuide();
            }, 3.5);
            this.resultButtonsReady = false;
            this.btn_again_faild.node.active = false;
            this.btn_menu_faild.node.active = false;
            this.btn_again_win.node.active = false;
            this.btn_menu_win.node.active = false;
            this.btn_nextlevel.node.active = false;
        } else {
            console.log("插屏广告未加载完毕，不显示");
            this.btn_again_faild.node.active = true;
            this.btn_menu_faild.node.active = true;
            this.btn_again_win.node.active = true;
            this.btn_menu_win.node.active = true;
            this.ShowNextlevel();
            this.resultButtonsReady = true;
            this.scheduleOnce(() => this.checkGuide(), 0);
        }
    }

    private checkGuide() {
        if (!this.resultButtonsReady || !this.sucess.active) {
            return;
        }
        if (PlayerPrefb.getInt("GuideStep_GetReward", 1) !== 1) {
            return;
        }
        if (!this.btn_get_jifen_reward || !this.btn_get_jifen_reward.node.activeInHierarchy || !this.btn_get_jifen_reward.interactable) {
            return;
        }
        Main.DispEvent("GUIDE_SHOW", "getreward");
        PlayerPrefb.setInt("GuideStep_GetReward", 2);
    }

    private ensureTransform(node: Node, width: number, height: number): UITransform {
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        transform.setContentSize(width, height);
        return transform;
    }

    private createFaildLabel(name: string, parent: Node, y: number, fontSize: number, color: Color, width: number = 650): Label {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(0, y, 0);
        this.ensureTransform(node, width, fontSize + 18);

        const label = node.addComponent(Label);
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = color;
        (label as any).isBold = true;
        return label;
    }

    private createFaildSprite(name: string, parent: Node, sourceFrame: SpriteFrame | null, width: number, height: number, color: Color, y: number): Node | null {
        if (!sourceFrame) {
            return null;
        }

        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(0, y, 0);
        this.ensureTransform(node, width, height);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = sourceFrame;
        sprite.type = 1;
        sprite.sizeMode = 0;
        sprite.color = color;
        return node;
    }

    private getButtonLabel(button: Button | null): Label | null {
        if (!button || !button.node) {
            return null;
        }
        for (const child of button.node.children) {
            const label = child.getComponent(Label);
            if (label) {
                return label;
            }
        }
        return null;
    }

    private setupFaildView() {
        if (this.faildViewReady || !this.faild) {
            return;
        }

        const panel = this.faild.getChildByName("bg_Items");
        const panelSprite = panel?.getComponent(Sprite);
        const panelFrame = panelSprite ? panelSprite.spriteFrame : null;

        const overlay = this.createFaildSprite(
            "faild_soft_overlay",
            this.faild,
            panelFrame,
            1080,
            2160,
            new Color(34, 28, 24, 96),
            0
        );
        if (overlay) {
            overlay.setSiblingIndex(0);
        }

        if (panel) {
            panel.setPosition(0, 30, 0);
            const panelTransform = panel.getComponent(UITransform);
            if (panelTransform) {
                panelTransform.setContentSize(850, 965);
            }
            if (panelSprite) {
                panelSprite.color = new Color(255, 246, 218, 255);
            }
            const decor = panel.getChildByName("Sprite");
            if (decor) {
                decor.setPosition(0, 487, 0);
                decor.setScale(1.08, 1.08, 1);
            }
        }

        this.faildHintLabel = this.createFaildLabel("faild_hint", this.faild, 452, 34, new Color(137, 80, 46, 255), 690);
        this.faildScoreTitleLabel = this.createFaildLabel("faild_score_title", this.faild, 318, 38, new Color(130, 73, 34, 255), 620);
        const titleLabel = this.createFaildLabel("faild_title", this.faild, 540, 56, new Color(255, 244, 210, 255), 560);
        titleLabel.string = "挑战失败";

        const titlePlate = this.createFaildSprite(
            "faild_title_plate",
            this.faild,
            this.btn_again_faild?.node?.getComponent(Sprite)?.spriteFrame || panelFrame,
            430,
            112,
            new Color(211, 84, 45, 255),
            540
        );
        if (titlePlate) {
            titlePlate.setSiblingIndex(titleLabel.node.getSiblingIndex());
            titleLabel.node.setSiblingIndex(titlePlate.getSiblingIndex() + 1);
        }

        if (this.level_faild) {
            this.level_faild.fontSize = 38;
            this.level_faild.lineHeight = 42;
            this.level_faild.color = new Color(92, 0, 0, 255);
            (this.level_faild as any).isBold = true;
        }

        if (this.lbl_soruce_faild) {
            this.lbl_soruce_faild.fontSize = 76;
            this.lbl_soruce_faild.lineHeight = 82;
            this.lbl_soruce_faild.color = new Color(255, 255, 255, 255);
            (this.lbl_soruce_faild as any).isBold = true;
            this.lbl_soruce_faild.node.setPosition(0, 238, 0);
            this.ensureTransform(this.lbl_soruce_faild.node, 540, 90);
        }

        const rewardNode = this.faild.getChildByName("tools");
        if (rewardNode) {
            rewardNode.setPosition(0, 82, 0);
            this.ensureTransform(rewardNode, 630, 138);
            const rewardSprite = rewardNode.getComponent(Sprite);
            if (rewardSprite) {
                rewardSprite.color = new Color(255, 225, 174, 255);
            }
            const rewardView = rewardNode.getChildByName("view");
            if (rewardView) {
                rewardView.active = false;
            }
            const rewardButton = rewardNode.getChildByName("lingqu");
            if (rewardButton) {
                rewardButton.active = false;
            }
            const richNode = rewardNode.getChildByName("RichText");
            if (richNode) {
                richNode.setPosition(0, 0, 0);
                this.ensureTransform(richNode, 570, 92);
                this.faildProgressText = richNode.getComponent(RichText);
                if (this.faildProgressText) {
                    this.faildProgressText.fontSize = 30;
                    this.faildProgressText.lineHeight = 40;
                    this.faildProgressText.horizontalAlign = 1;
                    this.faildProgressText.fontColor = new Color(118, 70, 35, 255);
                }
            }
        }

        this.btn_again_faild.node.setPosition(0, -580, 0);
        this.btn_again_faild.node.setScale(1.08, 1.08, 1);
        this.btn_menu_faild.node.setPosition(0, -730, 0);
        this.btn_menu_faild.node.setScale(0.96, 0.96, 1);

        const againLabel = this.getButtonLabel(this.btn_again_faild);
        if (againLabel) {
            againLabel.string = "再试一次";
            againLabel.fontSize = 42;
            againLabel.color = new Color(255, 246, 208, 255);
        }
        const menuLabel = this.getButtonLabel(this.btn_menu_faild);
        if (menuLabel) {
            menuLabel.fontSize = 38;
            menuLabel.color = new Color(255, 236, 185, 255);
        }

        this.faildViewReady = true;
    }

    private getFaildRewardProgressText(score: number): string {
        const currentJifen = PlayerPrefb.getInt("jifen", 0);
        const rewardInfo = this.getNextJifenRewardInfo(currentJifen);
        if (!rewardInfo) {
            return `<color=#7a4c24>当前积分 ${currentJifen}，继续挑战刷新最好成绩</color>`;
        }

        if (rewardInfo.canClaim) {
            return `<color=#7a4c24>当前积分 </color><color=#19a85d>${currentJifen}</color><color=#7a4c24>，已有奖励可领取</color>`;
        }

        const need = Math.max(0, rewardInfo.threshold - currentJifen);
        if (score <= 0) {
            return `<color=#7a4c24>当前积分 </color><color=#d9542d>${currentJifen}</color><color=#7a4c24>，距离下个奖励还差 </color><color=#19a85d>${need}</color><color=#7a4c24> 积分</color>`;
        }
        return `<color=#7a4c24>本局得分 </color><color=#d9542d>${score}</color><color=#7a4c24>，距离下个奖励还差 </color><color=#19a85d>${need}</color><color=#7a4c24> 积分</color>`;
    }

    private showFaildResult(score: number, hint: string, scoreTitle: string = "本局得分") {
        this.setupFaildView();

        if (this.faildHintLabel) {
            this.faildHintLabel.string = hint;
        }
        if (this.faildScoreTitleLabel) {
            this.faildScoreTitleLabel.string = scoreTitle;
        }
        if (this.faildProgressText) {
            this.faildProgressText.string = this.getFaildRewardProgressText(score);
        }
    }

    protected onLoad(): void {


        this.setupFaildView();

        this.btn_again_faild.node.on(Button.EventType.CLICK, () =>
        {
            // 检查是否为无限模式
            if (this.level_played === -1) {
                // 无限模式失败后重新开始无限模式
                Main.DispEvent("event_play", LevelMgr.level);
                this.hide();
            }
            // 检查是否为分层叠加模式
            else if (this.level_played === -3) {
                Main.DispEvent("event_play_layersplit", LevelMgr.level);
                // 分层叠加模式失败后重新开始分层叠加模式
                this.hide();
            }
            else {
                // 普通模式失败后重新开始当前关卡
                Main.DispEvent("event_play", this.level_played);
            }
        }, this);

        this.btn_menu_faild.node.on(Button.EventType.CLICK, () =>
        {

            Main.DispEvent("event_begin");

        }, this);

        this.btn_again_win.node.on(Button.EventType.CLICK, () =>
        {
            // 检查是否为无限模式
            if (this.level_played === -1) {
                // 无限模式胜利后重新开始无限模式
                Main.DispEvent("event_play", LevelMgr.level);
                this.hide();
            }
            // 检查是否为分层叠加模式
            else if (this.level_played === -3) {
                Main.DispEvent("event_play_layersplit", LevelMgr.level);
                // 分层叠加模式胜利后重新开始分层叠加模式
                this.hide();
            }
            else {
                // 普通模式胜利后重新开始当前关卡
                Main.DispEvent("event_play", this.level_played);
            }
        }, this);

         this.btn_menu_win.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_begin");
            Main.DispEvent("GUIDE_GETREWARD_HOME_CLICK");
        }, this);

        // 添加积分奖励按钮点击事件
        if (this.btn_get_jifen_reward) {
            this.btn_get_jifen_reward.node.on(Button.EventType.CLICK, () => {
                this.claimJifenReward();
            }, this);
        }

        this.btn_nextlevel.node.on(Button.EventType.CLICK, () =>
        {
            Main.DispEvent("event_result_next");
            if(this.level_played<LevelMgr.realmaxlevel)
            {
                LevelMgr.level = Math.max(LevelMgr.level, this.level_played + 1);
            }
            Main.DispEvent("event_play", this.level_played+1);
        }, this);

        Main.RegistEvent("event_interstitialAd_close", (x)=>{
            this.btn_again_faild.node.active = true;
            this.btn_menu_faild.node.active = true;
            this.btn_again_win.node.active = true;
            this.btn_menu_win.node.active = true;
            this.ShowNextlevel();
            this.resultButtonsReady = true;
            this.checkGuide();
        });
        Main.RegistEvent("GET_GETREWARD_CTRL", (x) => {
            return this.btn_get_jifen_reward;
        });
        Main.RegistEvent("GET_GETREWARD_NEXT", (x) => {
            return this.btn_nextlevel;
        });
        Main.RegistEvent("GET_GETREWARD_HOME", (x) => {
            return this.btn_menu_win;
        });
        Main.RegistEvent("game_win", (x) =>
        {
            this.level_played = x;
            this.sucess.active=true;// .gameObject.SetActive(true);
            this.faild.active=false;
            frm_main.isPause=true;
            this.level_suc.string ="关卡："+(this.level_played+1);
            let time = Main.DispEvent("time_used");
            // 使用新的得分计算方法
            let source = LevelMgr.calculateScore(this.level_played, time);
            let  old = PlayerPrefb.getInt("level_"+this.level_played, 0);
            if (source > old)
            {
                PlayerPrefb.setInt("level_"+this.level_played, source);
            }

            //this.lbl_source_suc.string =this.formatNumber(source);
            this.brushStar(this.level_played);

            // 检查是否为记忆模式，如果是则隐藏下一关按钮
            const currentGameType = Main.DispEvent("event_get_game_type");
            if (currentGameType === 'mem') {
                // 记忆模式下隐藏下一关按钮
                this.btn_nextlevel.node.active = false;
            } else {
                // 其他模式下显示下一关按钮
                this.ShowNextlevel();
            }

            // StartCoroutine(showsource(source_suc, source));
            this.show();
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(x);
            Main.DispEvent("event_playwin", x);
            // 显示当前游戏模式
            this.updateModeLabel(true);
            // 积分会在frm_main.ts中保存

            // 添加剩余时间转换为积分的逻辑
            this.addRemainingTimeToScore();

            // 显示积分信息
            this.showJifenInfo();
            // 显示积分奖励
            this.showJifenReward();
            // 显示积分奖励预览
            this.showJifenRewardPreview();

            return null;
        });

        // 添加无限模式胜利事件处理
        Main.RegistEvent("game_win_infinite", () =>
        {
            this.level_played = -1; // 无限模式使用特殊关卡编号
            this.sucess.active=true;
            this.faild.active=false;
            frm_main.isPause=true;
            this.level_suc.string = "无限模式";
            // 无限模式没有时间概念，显示特殊信息
            //this.lbl_source_suc.string = "成功清空网格";
            // 隐藏下一关按钮，只显示再玩一次按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(-1); // 使用-1表示无限模式
            Main.DispEvent("event_playwin", -1);
            // 积分会在frm_main.ts中保存

            // 显示积分信息
            this.showJifenInfo();
            // 显示积分奖励
            this.showJifenReward();
            // 显示积分奖励预览
            this.showJifenRewardPreview();

            return null;
        });

        // 添加分层叠加模式胜利事件处理
        Main.RegistEvent("game_win_layersplit", () =>
        {
            this.level_played = -3; // 分层叠加模式使用特殊关卡编号
            this.sucess.active=true;
            this.faild.active=false;
            frm_main.isPause=true;
            this.level_suc.string = "分层叠加模式";
            // 分层叠加模式没有时间概念，显示特殊信息
            //this.lbl_source_suc.string = "成功消除所有卡牌";
            // 隐藏下一关按钮，只显示再玩一次按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            Main.DispEvent("event_playwin", -3); // 使用-3表示分层叠加模式
            Main.DispEvent("game_stopbackground_music");
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(-3); // 使用-3表示分层叠加模式
            // 积分会在frm_main.ts中保存

            // 显示积分信息
            this.showJifenInfo();
            // 显示积分奖励
            this.showJifenReward();
            // 显示积分奖励预览
            this.showJifenRewardPreview();

            return null;
        });

        Main.RegistEvent("game_lose", (x) =>
        {
            this.level_played =x;
            this.level_faild.string = "关卡："+(x+1);
            this.faild.active=true;
            this.sucess.active=false;
            let time = Main.DispEvent("time_used");
            // 使用新的得分计算方法
            let source = LevelMgr.calculateScore(this.level_played, time);
            this.lbl_soruce_faild.string =this.formatNumber( source);
            this.showFaildResult(source, "还差一点就能过关，调整路线再试一次");
            this.show();
            // 上报游戏失败事件
            ToutiaoEventMgr.reportGameLose(x);

            // 显示当前游戏模式
            this.updateModeLabel(false);
            // 积分会在frm_main.ts中保存
            return null;
        });

        // 添加无限模式失败事件处理
        Main.RegistEvent("game_lose_infinite", () =>
        {
            this.level_played = -1; // 无限模式使用特殊关卡编号
            this.level_faild.string = "无限模式";
            this.faild.active=true;
            this.sucess.active=false;
            // 无限模式没有时间概念，显示特殊信息
            this.lbl_soruce_faild.string = "网格已满";
            this.showFaildResult(0, "网格已经填满，优先清出中间区域", "失败原因");
            // 隐藏下一关按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            // 上报游戏失败事件
            ToutiaoEventMgr.reportGameLose(-1); // 使用-1表示无限模式
            // 积分会在frm_main.ts中保存
            return null;
        });

        // 添加分层叠加模式失败事件处理
        Main.RegistEvent("game_lose_layersplit", () =>
        {
            this.level_played = -3; // 分层叠加模式使用特殊关卡编号
            this.level_faild.string = "分层叠加模式";
            this.faild.active=true;
            this.sucess.active=false;
            // 分层叠加模式没有时间概念，显示特殊信息
            this.lbl_soruce_faild.string = "卡槽已满";
            this.showFaildResult(0, "卡槽已经填满，先消除外层再推进", "失败原因");
            // 隐藏下一关按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            // 上报游戏失败事件
            ToutiaoEventMgr.reportGameLose(-3); // 使用-3表示分层叠加模式

            // 停止背景音乐并播放失败音效
            try {
                Main.DispEvent("event_heartbeat_stop"); // 停止心跳音效
                // 直接调用失败音效，避免事件循环
                Main.DispEvent("game_stopbackground_music"); // 使用通用失败事件播放音效
                // 添加停止背景音乐的处理
                Main.DispEvent("stop_background_music"); // 停止背景音乐
            } catch (error) {
                console.error('播放失败音效时出错:', error);
            }

            // 积分会在frm_main.ts中保存
            return null;
        });

        Main.RegistEvent("gamebegin", (x) =>
        {
            this.hide();
            return null;
        });

        Main.RegistEvent("event_begin", (x) =>
        {
            // 停止心跳音效
            Main.DispEvent("event_heartbeat_stop");
            this.hide();
            return null;
        });

        Main.RegistEvent("event_play", (x) =>
        {
            this.hide();
            return null;
        });
    }

    /**
     * 更新模式标签显示
     */
    updateModeLabel(isWin: boolean) {
        if (isWin && this.lbl_mode_suc) {
            if (LevelMgr.gameMode === GameMode.EASY) {
                this.lbl_mode_suc.string = "简单模式";
                this.lbl_mode_suc.color = new Color(0, 255, 0); // 绿色
            } else {
                this.lbl_mode_suc.string = "困难模式";
                this.lbl_mode_suc.color = new Color(255, 0, 0); // 红色
            }
        } else if (!isWin && this.lbl_mode_faild) {
            if (LevelMgr.gameMode === GameMode.EASY) {
                this.lbl_mode_faild.string = "简单模式";
                this.lbl_mode_faild.color = new Color(0, 255, 0); // 绿色
            } else {
                this.lbl_mode_faild.string = "困难模式";
                this.lbl_mode_faild.color = new Color(255, 0, 0); // 红色
            }
        }
    }

    brushStar(level_played: number) {
            let time = Main.DispEvent("time_used");
            let timer_all = LevelMgr.getTimeAll(this.level_played);
            let per =1- time / timer_all;
        if (this.star_1) this.star_1.active = per > 0.05;
        if (this.star_2) this.star_2.active = per > 0.3;
        if (this.star_3) this.star_3.active = per > 0.65;
    }
    start() {

    }

    update(deltaTime: number) {

    }

    /**
     * 显示积分信息
     */
    private showJifenInfo() {
        if (this.lbl_jifen_suc) {
            // 获取本局积分
            const currentJifen = Main.DispEvent("event_get_current_jifen");
            this.lbl_jifen_suc.string = "本局得分: " + currentJifen;
        }
    }

    /**
     * 获取下一个积分奖励信息
     * @param currentJifen 当前积分
     * @returns 奖励信息或null
     */
    private getNextJifenRewardInfo(currentJifen: number): { threshold: number, rewards: { type: string, count: number }[], description: string, canClaim: boolean } | null {
        // 通过消息传递获取积分奖励信息
        return JifenRewardManager.getNextJifenRewardInfo(currentJifen);
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
        // 通过事件系统通知主界面添加道具
        Main.DispEvent('event_add_item', { type: rewardType, count: count });

        // 直接更新玩家数据
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
        Main.DispEvent('event_claim_jifen_reward');
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
            // 刷新积分奖励预览
            this.showJifenRewardPreview();
        }
    }

    /**
     * 显示积分奖励预览
     */
    private showJifenRewardPreview() {
        // 检查是否已添加 trans_items 节点
        if (!this.trans_items) {
            console.warn("trans_items 节点未设置，无法显示奖励预览");
            return;
        }

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
     * 将剩余时间转换为积分并添加到本局得分
     */
    private addRemainingTimeToScore() {
        try {
            // 获取剩余时间
            const remainingTime = Main.DispEvent("event_get_remaining_time");

            // 只有在计时模式下且有剩余时间时才转换积分
            if (remainingTime > 0) {
                // 获取当前关卡
                const currentLevel = this.level_played;

                // 根据关卡和游戏模式计算积分转换率
                let timeToScoreRatio = 1; // 基础转换率

                // 根据游戏模式调整转换率
                if (LevelMgr.gameMode === GameMode.HARD) {
                    timeToScoreRatio = 1.5; // 困难模式转换率更高
                }

                // 根据关卡数调整转换率（关卡越高，转换率越高）
                const levelBonus = Math.floor(currentLevel / 10) * 0.2; // 每10关增加0.2倍转换率
                timeToScoreRatio += levelBonus;

                // 计算转换后的积分（每秒转换为1分基础分，再乘以转换率）
                const timeScore = Math.floor(remainingTime * timeToScoreRatio);

                // 添加积分
                if (timeScore > 0) {
                    Main.DispEvent("event_add_jifen", timeScore);
                    console.log(`剩余时间 ${remainingTime.toFixed(1)}秒 转换为积分: ${timeScore}`);
                }
            }
        } catch (error) {
            console.error("转换剩余时间为积分时出错:", error);
        }
    }
}
