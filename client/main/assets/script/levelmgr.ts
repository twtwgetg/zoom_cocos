import { sys } from 'cc';
import { PlayerPrefb } from './PlayerPrefb';
import { Main } from './main';
import { tools } from './tools';

// 添加游戏模式枚举
export enum GameMode {
    EASY = "easy",
    HARD = "hard"
}

// 添加游戏类型枚举
export enum GameType {
    NORMAL = "normal",           // 普通连连看模式
    INFINITE = "infinite",       // 无限模式
    SANXIAO = "sanxiao",         // 三消模式
    LAYER_SPLIT = "layer_split", // 分层叠加模式
    MEM = "mem"                  // 记忆模式
}

export class LevelMgr {
    private static _maxlevel: number = 50;
    private static _maxcount: number = 30;

    /**
     * 获取当前游戏模式
     */
    public static get gameMode(): GameMode {
        const mode = PlayerPrefb.getInt("gameMode", 0);
        // 修改默认模式为简单模式（0表示简单模式）
        return mode === 0 ? GameMode.EASY : GameMode.HARD;
    }

    /**
     * 设置当前游戏模式
     */
    public static set gameMode(value: GameMode) {
        // 修改模式值，0表示简单模式，1表示困难模式
        const modeValue = value === GameMode.EASY ? 0 : 1;
        PlayerPrefb.setInt("gameMode", modeValue);
    }

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
     * 根据卡牌数量计算时间，而不是关卡级别
     */
    public static getTimeAll(level: number): number {
        // 计算当前关卡的卡牌数量
        const width = this.getWid(level);
        const height = this.getHei(level);
        const totalCells = width * height;
        const totalPairs = totalCells / 2; // 卡牌对数
        const totalCards = totalPairs * 2; // 总卡牌数
        
        // 基础时间：每张卡牌给予一定的时间
        let baseTimePerCard: number;
        
        // 根据游戏模式调整每张卡牌的时间
        if (this.gameMode === GameMode.EASY) {
            baseTimePerCard = 2; // 简单模式每张卡牌2秒
        } else {
            baseTimePerCard = 1; // 困难模式每张卡牌1秒
        }
        
        // 计算基础时间
        let baseTime = totalCards * baseTimePerCard;
        
        // 设置最小和最大时间限制
        const minTime = 30;  // 最少30秒
        const maxTime = 180; // 最多180秒（3分钟）
        baseTime = Math.max(minTime, Math.min(baseTime, maxTime));
        
        // 第一关给予更多时间作为新手引导
        if (level === 0) {
            baseTime = Math.max(baseTime, 60); // 第一关至少60秒
        }
        
        return baseTime;
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
            return 6; // 第一关只用6种不同的碎片（比之前更少）
        }
        
        const t = level / LevelMgr._maxlevel;
        // 从第二关开始：从18种类型开始，最高达到30种类型（比之前更多）
        return Math.floor(this.lerp(18, 30, t));
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
            return 6 // 中后期关卡较难，确保至少8列
        } else {
            return 6; // 后期关卡更难（从10增加到12）
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
            return 6; // 早期关卡保持简单
        } else if (t < 0.4) {
            return 8; // 中期关卡适中
        } else if (t < 0.7) {
            return 9; // 中后期关卡更难（从12增加到14）
        } else {
            return 10; // 后期关卡非常难（从14增加到16）
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
        // 随着关卡推进，道具冷却时间从10秒增加到30秒（比之前更长）
        return this.lerp(10000, 30000, t);
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