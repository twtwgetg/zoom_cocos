import { _decorator, Component, Sprite, Material, Color, view } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 黑白格子Sprite组件
 * 用于将黑白格子Shader应用到Sprite上
 */
@ccclass('CheckerboardSprite')
export class CheckerboardSprite extends Component {
    @property(Sprite)
    targetSprite: Sprite = null!;

    @property(Material)
    checkerboardMaterial: Material = null!;

    @property
    useSimpleShader: boolean = false;

    @property
    color1: Color = Color.BLACK;

    @property
    color2: Color = Color.WHITE;

    @property
    columns: number = 10;

    @property
    rows: number = 10;

    @property
    patternStrength: number = 1.0;

    @property
    autoFitToScreen: boolean = false;

    @property
    baseScreenWidth: number = 1920;

    @property
    baseScreenHeight: number = 1080;

    start() {
        // 如果没有指定目标Sprite，则使用组件所在节点的Sprite组件
        if (!this.targetSprite) {
            this.targetSprite = this.getComponent(Sprite);
        }

        // 应用黑白格子材质
        if (this.targetSprite && this.checkerboardMaterial) {
            // 创建材质的新实例以避免影响其他Sprite
            const materialInstance = new Material();
            materialInstance.initialize({
                effectAsset: this.checkerboardMaterial.effectAsset
            });
            
            // 根据屏幕尺寸自动调整行列数
            let finalColumns = this.columns;
            let finalRows = this.rows;
            
            if (this.autoFitToScreen) {
                const screenSize = view.getVisibleSize();
                const widthRatio = screenSize.width / this.baseScreenWidth;
                const heightRatio = screenSize.height / this.baseScreenHeight;
                
                finalColumns = Math.max(1, Math.round(this.columns * widthRatio));
                finalRows = Math.max(1, Math.round(this.rows * heightRatio));
            }
            
            // 设置颜色参数
            materialInstance.setProperty('color1', this.color1);
            materialInstance.setProperty('color2', this.color2);
            
            // 设置行列数参数
            materialInstance.setProperty('columns', finalColumns);
            materialInstance.setProperty('rows', finalRows);
            
            // 设置图案强度参数
            materialInstance.setProperty('patternStrength', this.patternStrength);
            
            // 应用材质到Sprite
            this.targetSprite.customMaterial = materialInstance;
        }
    }

    /**
     * 切换到简化版Shader
     */
    public switchToSimpleShader() {
        this.useSimpleShader = true;
        // 这里需要重新应用材质，实际项目中可能需要通过其他方式获取简化版Shader的引用
        console.log("切换到简化版Shader");
    }

    /**
     * 更新颜色1
     * @param color 颜色1
     */
    public updateColor1(color: Color) {
        this.color1 = color;
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('color1', this.color1);
        }
    }

    /**
     * 更新颜色2
     * @param color 颜色2
     */
    public updateColor2(color: Color) {
        this.color2 = color;
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('color2', this.color2);
        }
    }

    /**
     * 更新行列数
     * @param columns 列数
     * @param rows 行数
     */
    public updateGridSize(columns: number, rows: number) {
        this.columns = columns;
        this.rows = rows;
        
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('columns', this.columns);
            this.targetSprite.customMaterial.setProperty('rows', this.rows);
        }
    }

    /**
     * 更新图案强度
     * @param strength 图案强度 (0.0 - 1.0)
     */
    public updatePatternStrength(strength: number) {
        this.patternStrength = strength;
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('patternStrength', this.patternStrength);
        }
    }

    /**
     * 根据屏幕尺寸重新调整行列数
     */
    public resizeToFitScreen() {
        if (!this.autoFitToScreen) return;
        
        const screenSize = view.getVisibleSize();
        const widthRatio = screenSize.width / this.baseScreenWidth;
        const heightRatio = screenSize.height / this.baseScreenHeight;
        
        const finalColumns = Math.max(1, Math.round(this.columns * widthRatio));
        const finalRows = Math.max(1, Math.round(this.rows * heightRatio));
        
        if (this.targetSprite && this.targetSprite.customMaterial) {
            this.targetSprite.customMaterial.setProperty('columns', finalColumns);
            this.targetSprite.customMaterial.setProperty('rows', finalRows);
        }
    }
}