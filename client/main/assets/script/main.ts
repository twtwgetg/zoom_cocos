import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

// 事件回调接口
interface IEventCallback {
    (data?: any): any;
}

@ccclass('Main')
export class Main extends Component {
    
    // 单例实例
 
    // 事件映射表
    private static eventMap: Map<string, IEventCallback[]> = new Map();
    protected onLoad(): void {
        
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