// levelmgr.ts
import { sys } from 'cc';
import { PlayerPrefb } from './PlayerPrefb';
import { Main } from './main';
import { tools } from './tools';
export class LevelMgr {
    private static _maxlevel: number = 50;
    private static _maxcount: number = 30;

    /**
     * 获取当前关卡
     */
    public static get level(): number {
        return PlayerPrefb.getInt("level", 0);
    }

    /**
     * 设置当前关卡
     */
    public static set level(value: number) {
        PlayerPrefb.setInt("level", value);
    }

    /**
     * 初始化关卡
     */
    public static init(): void {
        LevelMgr.level = 0;
        
        let oldremind = tools.num_Remind;
        let oldrefrush = tools.num_brush;
        let oldtime = tools.num_time;
        PlayerPrefb.Init(); // 初始化本地存储
        tools.num_Remind = oldremind;
        tools.num_brush = oldrefrush;
        tools.num_time = oldtime;
        Main.DispEvent("event_begin");
    }

    /**
     * 获取关卡时间
     * @param level 关卡
     * @return 时间
     * 第一关给予更充裕的时间，后续关卡逐渐增加难度
     */
    public static getTimeAll(level: number): number {
        // 第一关给予更多时间
        if (level === 0) {
            return 60; // 第一关60秒，足够新手熟悉
        }
        
        const t = level / LevelMgr.realmaxlevel;
        // 从第二关开始：30-80秒
        return this.lerp(30, 80, t);
    }

    /**
     * 获取碎片最小值
     */
    public static getMin(level: number): number {
        return level;
    }

    public static get maxcount(): number {
        return LevelMgr._maxcount;
    }

    public static get realmaxlevel(): number {
        return LevelMgr._maxlevel - LevelMgr._maxcount;
    }

    /**
     * 获取碎片数量（第一关特别简化）
     */
    public static getCount(level: number): number {
        // 第一关只用更少的碎片种类
        if (level === 0) {
            return 8; // 第一关只用8种不同的碎片
        }
        
        const t = level / LevelMgr._maxlevel;
        // 从第二关开始：从15种类型开始，最高达到25种类型
        return Math.floor(this.lerp(15, 25, t));
    }

    public static getWid(level_playing: number): number {
        // 第一关使用更小的网格
        if (level_playing === 0) {
            return 3; // 第一关只有3列
        }
        
        const t = level_playing / LevelMgr.realmaxlevel;
        // 增加网格宽度难度
        if (t < 0.15) {
            return 4; // 早期关卡保持简单
        } else if (t < 0.4) {
            return 6; // 中期关卡适中
        } else if (t < 0.7) {
            return 8; // 中后期关卡较难
        } else {
            return 10; // 后期关卡非常雾
        }
    }

    public static getHei(level_playing: number): number {
        // 第一关使用更小的网格
        if (level_playing === 0) {
            return 6; // 第一关只有6行
        }
        
        const t = level_playing / LevelMgr.realmaxlevel;
        // 增加网格高度难度
        if (t < 0.15) {
            return 8; // 早期关卡保持简单
        } else if (t < 0.4) {
            return 10; // 中期关卡适中
        } else if (t < 0.7) {
            return 12; // 中后期关卡较难
        } else {
            return 14; // 后期关卡非常雾
        }
    }

    public static getSource(level_playing: number): number {
        const t = level_playing / LevelMgr.realmaxlevel;
        // 改进的得分系统：
        // 1. 基础得分：每关有基础得分，从100分开始
        // 2. 难度加成：随着关卡推进，难度增加，得分也增加
        // 3. 时间奖励：剩余时间越多，得分越高
        // 4. 关卡得分范围：100 - 5000分
        return this.lerp(100, 5000, t);
    }

    /**
     * 线性插值函数
     * @param a 起始值
     * @param b 结束值
     * @param t 插值系数
     */
    private static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    /**
     * 获取道具冷却时间（毫秒）
     * @param level 关卡
     * @return 冷却时间（毫秒）
     */
    public static getToolCooldown(level: number): number {
        const t = level / LevelMgr.realmaxlevel;
        // 随着关卡推进，道具冷却时间从15秒增加到25秒
        return this.lerp(15000, 25000, t);
    }

    /**
     * 获取关卡难度系数（0-1）
     * @param level 关卡
     * @return 难度系数
     */
    public static getDifficultyFactor(level: number): number {
        return Math.min(level / LevelMgr.realmaxlevel, 1);
    }
    
    /**
     * 计算关卡得分
     * @param level_playing 当前关卡
     * @param time_used 使用的时间
     * @return 计算后的得分
     */
    public static calculateScore(level_playing: number, time_used: number): number {
        // 获取关卡基础得分
        const baseScore = this.getSource(level_playing);
        
        // 获取关卡总时间
        const totalTime = this.getTimeAll(level_playing);
        
        // 计算时间利用率（0-1之间）
        const timeRatio = Math.max(0, 1 - time_used / totalTime);
        
        // 根据时间利用率计算最终得分
        // 如果用时少（时间利用率高），得分会更高
        // 最终得分 = 基础得分 * (0.5 + 0.5 * 时间利用率)
        // 这样即使时间用完也能得到至少50%的基础得分
        const finalScore = baseScore * (0.5 + 0.5 * timeRatio);
        
        // 确保得分为整数
        return Math.floor(finalScore);
    }
}