import { _decorator, Component } from 'cc';
import { Main } from './main';
import { LevelMgr } from './levelmgr';

const { ccclass, property } = _decorator;

// 声明tt全局对象
declare const tt: any;

@ccclass('ToutiaoEventMgr')
export class ToutiaoEventMgr extends Component {
    private static _instance: ToutiaoEventMgr = null!;
    
    protected onLoad(): void {
        if (ToutiaoEventMgr._instance) {
            this.destroy();
            return;
        }
        
        ToutiaoEventMgr._instance = this;
        this.initEvents();
    }
    
    private initEvents(): void {
        // 注册所有需要埋点的事件
        Main.RegistEvent("event_charge", (x) => {
            this.reportEvent("charge", { 
                level: LevelMgr.level,
                timestamp: Date.now()
            });
            return null;
        });
        
        Main.RegistEvent("event_gamelose", (x) => {
            this.reportEvent("gamelose", { 
                level: x,
                timestamp: Date.now()
            });
            return null;
        });
        
        Main.RegistEvent("event_gamewin", (x) => {
            this.reportEvent("gamewin", { 
                level: x,
                timestamp: Date.now()
            });
            return null;
        });
        
        Main.RegistEvent("event_level", (x) => {
            this.reportEvent("level", { 
                level: x,
                timestamp: Date.now()
            });
            return null;
        });
        
        Main.RegistEvent("event_peng", (x) => {
            this.reportEvent("peng", { 
                level: LevelMgr.level,
                timestamp: Date.now()
            });
            return null;
        });
        
        Main.RegistEvent("event_useItem", (x) => {
            this.reportEvent("useItem", { 
                itemType: x?.type || 0,
                level: LevelMgr.level,
                timestamp: Date.now()
            });
            return null;
        });
    }
    
    /**
     * 上报事件到抖音小游戏平台
     * @param eventName 事件名称
     * @param data 事件数据
     */
    private reportEvent(eventName: string, data: any): void {
        // 检查是否在抖音小游戏环境中
        if (typeof tt === 'undefined') {
            console.log(`[ToutiaoEventMgr] 非抖音环境，事件${eventName}不会上报:`, data);
            return;
        }
        
        try {
            // 使用抖音小游戏的事件上报API
            tt.reportAnalytics(eventName, data);
            console.log(`[ToutiaoEventMgr] 事件${eventName}上报成功:`, data);
        } catch (error) {
            console.error(`[ToutiaoEventMgr] 事件${eventName}上报失败:`, error);
        }
    }
    
    /**
     * 上报挑战事件（主动进入游戏）
     */
    public static reportCharge(): void {
        Main.DispEvent("event_charge");
    }
    
    /**
     * 上报游戏失败事件
     * @param level 关卡数
     */
    public static reportGameLose(level: number): void {
        Main.DispEvent("event_gamelose", level);
    }
    
    /**
     * 上报游戏胜利事件
     * @param level 关卡数
     */
    public static reportGameWin(level: number): void {
        Main.DispEvent("event_gamewin", level);
    }
    
    /**
     * 上报进入关卡事件
     * @param level 关卡数
     */
    public static reportLevel(level: number): void {
        Main.DispEvent("event_level", level);
    }
    
    /**
     * 上报第一次碰撞事件（玩家开始玩了）
     */
    public static reportPeng(): void {
        Main.DispEvent("event_peng");
    }
    
    /**
     * 上报使用道具事件
     * @param itemType 道具类型
     */
    public static reportUseItem(itemType: number): void {
        Main.DispEvent("event_useItem", { type: itemType });
    }
}