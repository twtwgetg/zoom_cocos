import { _decorator, Component, Node } from 'cc';
import { ToutiaoEventMgr } from './ToutiaoEventMgr';
import { LevelMgr, GameMode } from './levelmgr';

const { ccclass, property } = _decorator;

// 事件回调接口
interface IEventCallback {
    (data?: any): any;
}
export enum platform {
    WECHAT = 'wechat',
    QQ = 'qq',
    TENCENT = 'tencent',
    BAIDU = 'baidu',
    ALIPAY = 'alipay',
    BYTE = 'byte',
    VIVO = 'vivo',
    OPPO = 'oppo',
    HUAWEI = 'huawei',
    XIAOMI = 'xiaomi',
}
@ccclass('Main')
export class Main extends Component {

    // 单例实例
    static plat: platform = platform.BYTE; // 当前平台
    // 事件映射表
    private static eventMap: Map<string, IEventCallback[]> = new Map();
    protected onLoad(): void {

        const tt = window['tt'];
        if (!tt) { 
            console.log('当前环境非抖音小程序');
            return;
        }
        console.log('当前环境是抖音小程序');
        // 监听游戏显示（从后台切换回来）
        // tt.onShow((res) => {
        //     console.log("启动参数：", res.query);
        //     console.log("来源信息：", res.refererInfo);
        //     console.log("场景值：", res.scene);
        //     console.log("启动场景字段：", res.launch_from, ", ", res.location);
        //   });
        
        // 添加抖音事件管理器组件
        if (!this.getComponent(ToutiaoEventMgr)) {
            this.addComponent(ToutiaoEventMgr);
        }
       
    }

    
    protected start(): void {
        Main.DispEvent("game_begin");
    }
    // 静态方法：注册事件
    public static RegistEvent(eventName: string, callback: IEventCallback): void {
        if (!this.eventMap.has(eventName)) {
            this.eventMap.set(eventName, []);
        }
        
        this.eventMap.get(eventName)!.push(callback);
    }
    static UnRegistEvent(eventName: string,callback: IEventCallback) {
        if (this.eventMap.has(eventName)) {
            this.eventMap.get(eventName)!.splice(this.eventMap.get(eventName)!.indexOf(callback), 1);
        }
        else{
            console.log("事件不存在"+eventName);
        }
    }
    
    
    // 静态方法：分发事件
    public static DispEvent(eventName: string, data?: any): any {
        if (this.eventMap.has(eventName)) {
            const callbacks = this.eventMap.get(eventName)!;
            let result: any = null;
            
            // 依次调用所有回调函数
            for (const callback of callbacks) {
                result = callback(data);
            }
            
            return result;
        }
        else{
            console.log("事件不存在"+eventName);
        }
        return null;
    }
       
}