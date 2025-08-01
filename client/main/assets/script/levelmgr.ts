// levelmgr.ts
import { sys } from 'cc';
export class LevelMgr {
    private static _maxlevel: number = 50;
    private static _maxcount: number = 30;

    /**
     * 获取当前关卡
     */
    public static get level(): number {
        const levelStr = sys.localStorage.getItem('level');
        return levelStr ? parseInt(levelStr) : 1;
    }

    /**
     * 设置当前关卡
     */
    public static set level(value: number) {
        sys.localStorage.setItem('level', value.toString());
    }

    /**
     * 初始化关卡
     */
    public static init(): void {
        LevelMgr.level = 1;
    }

    /**
     * 获取关卡时间
     * @param level 关卡
     * @return 时间
     * 关卡时间1到100秒
     */
    public static getTimeAll(level: number): number {
        const t = level / LevelMgr.realmaxlevel;
        return this.lerp(30, 100, t);
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
     * 获取碎片数量
     */
    public static getCount(level: number): number {
        const t = level / LevelMgr._maxlevel;
        return Math.floor(this.lerp(15, LevelMgr.realmaxlevel, t));
    }

    public static getWid(level_playing: number): number {
        const t = level_playing / LevelMgr.realmaxlevel;
        if (t < 0.2) {
            return 4;
        } else if (t < 0.6) {
            return 6;
        } else {
            return 8;
        }
    }

    public static getHei(level_playing: number): number {
        const t = level_playing / LevelMgr.realmaxlevel;
        if (t < 0.2) {
            return 8;
        } else if (t < 0.6) {
            return 10;
        } else {
            return 12;
        }
    }

    public static getSource(level_playing: number): number {
        const t = level_playing / LevelMgr.realmaxlevel;
        return this.lerp(1000, 10000000, t);
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
}