import { _decorator, Component, Sprite, Material, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 极简Shader使用示例
 */
@ccclass('SimpleShaderExample')
export class SimpleShaderExample extends Component {
    @property(Sprite)
    targetSprite: Sprite = null!;

    @property(Material)
    simpleMaterial: Material = null!;

    start() {
        // 如果没有指定目标Sprite，则使用组件所在节点的Sprite组件
        if (!this.targetSprite) {
            this.targetSprite = this.getComponent(Sprite);
        }

        // 应用极简材质到Sprite
        if (this.targetSprite && this.simpleMaterial) {
            this.targetSprite.customMaterial = this.simpleMaterial;
        }
    }

    /**
     * 更新色调颜色
     * @param color 新的颜色
     */
    updateTintColor(color: Color) {
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('tintColor', color);
        }
    }
}