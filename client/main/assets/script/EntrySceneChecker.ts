import { _decorator, Component } from 'cc';
import { Main } from './main';
const { ccclass } = _decorator;

// 声明tt类型（若已配置类型文件可省略）
declare const tt: any;

@ccclass('EntrySceneChecker')
export class EntrySceneChecker extends Component {
    onLoad() {
        // 监听游戏显示事件（包括从侧边栏进入）
        tt.onShow((res: any) => {
            this.checkEntryScene(res.scene);
        });
    }

    /**
     * 检查进入场景类型
     * @param scene 场景值（抖音SDK提供）
     */
    private checkEntryScene(scene: number) {
        // 1038通常对应侧边栏/最近使用入口（需测试确认）
        console.log("scene:", scene.toString());
        const bisFromSidebar = scene.toString() === '021036';
        EntrySceneChecker.isFromSidebar=false;
        if (bisFromSidebar) {
            console.log("用户从侧边栏进入游戏");
            // 执行侧边栏进入的逻辑（如弹窗提示、发放复访奖励等）
            this.handleSidebarEntry();
        } else {
            console.log(`用户从其他场景进入，场景值：${scene}`);
            // 其他场景的处理逻辑
        }
    }
    static isFromSidebar = false;
    /**
     * 处理从侧边栏进入的业务逻辑
     */
    private handleSidebarEntry() {
        EntrySceneChecker.isFromSidebar = true;
        Main.DispEvent("event_enterbrush"); 
    }
}