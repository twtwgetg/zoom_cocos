import { _decorator, Component, Node } from 'cc'; 
const { ccclass, property } = _decorator;
// 声明tt类型（若已配置类型文件可省略）
import { Main } from './main';
declare const tt: any;
@ccclass('PlatMgr')
export class PlatMgr extends Component {
    start() {
        Main.RegistEvent("event_addtodesktop",()=>{
            tt.addShortcut({
                success() {
                  console.log("添加桌面成功");

                  tt.ShowToast({
                    title: "添加成功",
                    icon: "success",
                    duration: 2000,
                  });
                },
                fail(err) {
                  console.log("添加桌面失败", err.errMsg);
                  tt.ShowToast({
                    title: "添加失败",
                    icon: "error",
                    duration: 2000,
                  });
                },
              });
        });
    }

    update(deltaTime: number) {
        
    }
}


