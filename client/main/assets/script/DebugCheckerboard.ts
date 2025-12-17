import { _decorator, Component, Sprite, Material, Color, view, game, director, Canvas } from 'cc';
import { CheckerboardSprite } from './CheckerboardSprite';
const { ccclass, property } = _decorator;

/**
 * 调试图像黑白格子Shader问题
 */
@ccclass('DebugCheckerboard')
export class DebugCheckerboard extends Component {
    start() {
        // 等待一帧确保所有组件都初始化完成
        this.scheduleOnce(() => {
            this.debugCheckerboard();
        }, 0);
    }

    debugCheckerboard() {
        console.log("=== 开始调试黑白格子Shader ===");
        
        // 检查Canvas
        const canvas = director.getScene()?.getComponentInChildren(Canvas);
        console.log("Canvas存在:", !!canvas);
        
        // 获取CheckerboardSprite组件
        const checkerboardSprite = this.node.getComponent(CheckerboardSprite);
        const sprite = this.node.getComponent(Sprite);
        
        if (sprite) {
            console.log("Sprite组件存在");
            console.log("Sprite材质:", sprite.material);
            console.log("Sprite自定义材质:", sprite.customMaterial);
            console.log("Sprite spriteFrame:", sprite.spriteFrame);
        }
        
        if (checkerboardSprite) {
            console.log("CheckerboardSprite组件存在");
            console.log("目标Sprite:", checkerboardSprite.targetSprite);
            console.log("材质:", checkerboardSprite.checkerboardMaterial);
            console.log("颜色1:", checkerboardSprite.color1);
            console.log("颜色2:", checkerboardSprite.color2);
            console.log("列数:", checkerboardSprite.columns);
            console.log("行数:", checkerboardSprite.rows);
            console.log("图案强度:", checkerboardSprite.patternStrength);
            
            // 测试修改参数
            console.log("=== 测试修改参数 ===");
            checkerboardSprite.updateColor1(Color.RED);
            checkerboardSprite.updateColor2(Color.BLUE);
            checkerboardSprite.updateGridSize(5, 5);
            checkerboardSprite.updatePatternStrength(0.5);
            
            // 检查材质属性
            if (checkerboardSprite.targetSprite && checkerboardSprite.targetSprite.customMaterial) {
                const material = checkerboardSprite.targetSprite.customMaterial;
                console.log("=== 材质属性 ===");
                console.log("- color1:", material.getProperty('color1'));
                console.log("- color2:", material.getProperty('color2'));
                console.log("- columns:", material.getProperty('columns'));
                console.log("- rows:", material.getProperty('rows'));
                console.log("- patternStrength:", material.getProperty('patternStrength'));
            }
        } else {
            console.log("未找到CheckerboardSprite组件");
        }
        
        console.log("=== 调试完成 ===");
    }
}