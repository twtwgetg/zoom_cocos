import { _decorator, Component, Color, view } from 'cc';
import { CheckerboardSprite } from './CheckerboardSprite';
const { ccclass, property } = _decorator;

/**
 * 黑白格子Shader使用示例
 */
@ccclass('CheckerboardExample')
export class CheckerboardExample extends Component {
    start() {
        // 获取CheckerboardSprite组件
        const checkerboardSprite = this.node.getComponent(CheckerboardSprite);
        
        if (checkerboardSprite) {
            // 示例1: 更改格子颜色为红色和蓝色
            checkerboardSprite.updateColor1(Color.RED);
            checkerboardSprite.updateColor2(Color.BLUE);
            
            // 示例2: 设置格子行列数
            checkerboardSprite.updateGridSize(15, 15);
            
            // 示例3: 调整图案强度
            checkerboardSprite.updatePatternStrength(0.8);
            
            // 示例4: 如果启用了自动适配屏幕，则根据当前屏幕尺寸调整
            checkerboardSprite.resizeToFitScreen();
        }
    }
}