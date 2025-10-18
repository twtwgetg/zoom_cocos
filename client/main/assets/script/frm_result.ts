import { _decorator, Button, Component, EditBox, Input, Label, Node, Color } from 'cc';
import { Main } from './main';
import { LevelMgr, GameMode } from './levelmgr';
import { frmbase } from './frmbase';
import { PlayerPrefb } from './PlayerPrefb';
import { frm_main } from './frm_main';
import { ToutiaoEventMgr } from './ToutiaoEventMgr';
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
    @property(Label)
    lbl_source_suc: Label = null!;

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
    protected onLoad(): void {

        
        this.btn_again_faild.node.on(Button.EventType.CLICK, () =>
        {
            // 检查是否为无限模式
            if (this.level_played === -1) {
                // 无限模式失败后重新开始无限模式
                Main.DispEvent("event_play_infinite");
                this.hide();
            } 
            // 检查是否为分层叠加模式
            else if (this.level_played === -3) {
                // 分层叠加模式失败后重新开始分层叠加模式
                Main.DispEvent("event_play_layersplit");
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
                Main.DispEvent("event_play_infinite");
                this.hide();
            } 
            // 检查是否为分层叠加模式
            else if (this.level_played === -3) {
                // 分层叠加模式胜利后重新开始分层叠加模式
                Main.DispEvent("event_play_layersplit");
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
        }, this);

        this.btn_nextlevel.node.on(Button.EventType.CLICK, () =>
        { 
            if(this.level_played<LevelMgr.realmaxlevel)
            {
                LevelMgr.level = Math.max(LevelMgr.level, this.level_played + 1);
            }
            Main.DispEvent("event_play", this.level_played+1);
        }, this);

 

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

            this.lbl_source_suc.string =this.formatNumber(source);
            this.brushStar(this.level_played);
            // 确保下一关按钮可见
            this.btn_nextlevel.node.active = true;
            // StartCoroutine(showsource(source_suc, source));
            this.show();
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(x);
            
            // 显示当前游戏模式
            this.updateModeLabel(true);
            // 积分会在frm_main.ts中保存
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
            this.lbl_source_suc.string = "成功清空网格";
            // 隐藏下一关按钮，只显示再玩一次按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(-1); // 使用-1表示无限模式
            // 积分会在frm_main.ts中保存
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
            this.lbl_source_suc.string = "成功消除所有卡牌";
            // 隐藏下一关按钮，只显示再玩一次按钮
            this.btn_nextlevel.node.active = false;
            this.show();
            // 上报游戏胜利事件
            ToutiaoEventMgr.reportGameWin(-3); // 使用-3表示分层叠加模式
            // 积分会在frm_main.ts中保存
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
            this.lbl_soruce_faild.string = "网格已填满";
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
            this.lbl_soruce_faild.string = "卡槽已填满";
            // 隐藏下一关按钮
            this.btn_nextlevel.node.active = false;
            this.show(); 
            // 上报游戏失败事件
            ToutiaoEventMgr.reportGameLose(-3); // 使用-3表示分层叠加模式
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
        // 降低星级门槛，让玩家更容易获得星星
        this.star_1.active = per > 0.05;  // 原来0.1，现在0.05 (5%)
        this.star_2.active = per > 0.3;   // 原来0.5，现在0.3 (30%)
        this.star_3.active =per > 0.65;  // 原来0.9，现在0.65 (65%)
    }
    start() {

    }

    update(deltaTime: number) {
        
    }
}