import { _decorator, Component, Material, Node, ParticleSystem2D, Sprite, tween, Vec2, Vec3, ParticleSystem, assetManager, ImageAsset, Texture2D } from 'cc';
import { Main } from './main';

const { ccclass, property } = _decorator;

@ccclass('WeatherShaderManager')
export class WeatherShaderManager extends Component {
    @property(Sprite)
    backgroundSprite: Sprite = null!;

    @property(Material)
    weatherMaterial: Material = null!;

    private originalMaterial: Material | null = null;
    private isWeatherActive: boolean = false;
    private snowEffectNode: Node | null = null;
    private snowParticleSystem: ParticleSystem2D | null = null;

    // 天气效果参数
    private weatherParams = {
        hueShift: -30,      // 负值偏向蓝色，营造阴天效果 (已在简化版中移除)
        saturation: 0.6,    // 降低饱和度 (已在简化版中移除)
        brightness: 0.8,    // 稍微变暗 (已在简化版中移除)
        weatherIntensity: 0.0 // 天气强度，0-1
    };

    start() {
        this.initShaderSystem();
        this.registerEvents();
        console.log('天气Shader管理器初始化完成');
    }

    /**
     * 初始化Shader系统
     */
    initShaderSystem() {
        if (!this.backgroundSprite) {
            console.warn('背景Sprite未设置，尝试自动查找...');
            this.findBackgroundSprite();
        }

        if (this.backgroundSprite) {
            // 保存原始材质
            this.originalMaterial = this.backgroundSprite.getMaterial(0);
            console.log('已保存原始背景材质');
        }

        if (!this.weatherMaterial) {
            console.warn('天气材质未设置，请在编辑器中指定weather-background材质');
        }

        // 创建雪花粒子系统
        this.createSnowEffect();
    }

    /**
     * 自动查找背景Sprite
     */
    findBackgroundSprite() {
        // 尝试在当前节点查找
        let sprite = this.node.getComponent(Sprite);
        if (sprite) {
            this.backgroundSprite = sprite;
            return;
        }

        // 尝试在子节点中查找名为background的节点
        let bgNode = this.node.getChildByName('background');
        if (bgNode) {
            let bgSprite = bgNode.getComponent(Sprite);
            if (bgSprite) {
                this.backgroundSprite = bgSprite;
                return;
            }
        }

        // 尝试查找第一个带Sprite组件的子节点
        let sprites = this.node.getComponentsInChildren(Sprite);
        if (sprites.length > 0) {
            this.backgroundSprite = sprites[0];
        }
    }

    /**
     * 注册游戏事件
     */
    registerEvents() {
        // 监听冰封事件
        Main.RegistEvent('event_fruszon', (isActive: boolean) => {
            // if (isActive) {
            //     this.activateWeatherEffect();
            // } else {
            //     this.deactivateWeatherEffect();
            // }
            return null;
        });

        // 监听游戏重新开始事件
        Main.RegistEvent('event_play', () => {
            this.resetWeatherEffect();
            return null;
        });

        console.log('天气效果事件监听已注册');
    }

    /**
     * 激活天气效果
     */
    activateWeatherEffect() {
        if (!this.backgroundSprite || !this.weatherMaterial) {
            console.warn('背景Sprite或天气材质未设置，无法应用天气效果');
            return;
        }

        if (this.isWeatherActive) {
            console.log('天气效果已经激活');
            return;
        }

        console.log('开始激活天气效果 - 阴天模式');

        // 应用天气材质
        this.backgroundSprite.setMaterial(this.weatherMaterial, 0);

        // 初始化参数
        this.setShaderParams(0, this.weatherParams.saturation, this.weatherParams.brightness, 0);

        // 平滑过渡到阴天效果
        this.animateWeatherTransition(true);

        // 播放雪花特效
        this.playSnowEffect();

        this.isWeatherActive = true;
    }

    /**
     * 取消天气效果
     */
    deactivateWeatherEffect() {
        if (!this.isWeatherActive) {
            console.log('天气效果未激活');
            return;
        }

        console.log('开始取消天气效果 - 恢复正常');

        // 停止雪花特效
        this.stopSnowEffect();

        // 平滑过渡回正常状态
        this.animateWeatherTransition(false);
    }

    /**
     * 重置天气效果
     */
    resetWeatherEffect() {
        if (this.backgroundSprite && this.originalMaterial) {
            this.backgroundSprite.setMaterial(this.originalMaterial, 0);
        }

        // 停止雪花特效
        this.stopSnowEffect();

        this.isWeatherActive = false;
        console.log('天气效果已重置');
    }

    /**
     * 设置Shader参数
     */
    setShaderParams(hueShift: number, saturation: number, brightness: number, weatherIntensity: number) {
        if (!this.weatherMaterial) return;

        // 简化版本只使用weatherIntensity参数
        this.weatherMaterial.setProperty('weatherIntensity', weatherIntensity);
        console.log('设置Shader参数 (简化版):', { weatherIntensity });
    }

    /**
     * 动画过渡天气效果
     */
    animateWeatherTransition(toWeather: boolean) {
        const duration = 1.0; // 过渡时间

        if (toWeather) {
            // 过渡到阴天效果
            const startParams = {
                hueShift: 0,
                saturation: 1.0,
                brightness: 1.0,
                weatherIntensity: 0
            };
            const endParams = this.weatherParams;

            tween(startParams).to(duration, {
                hueShift: endParams.hueShift,
                saturation: endParams.saturation,
                brightness: endParams.brightness,
                weatherIntensity: 0.8
            }, {
                easing: 'smooth',
                onUpdate: (target) => {
                    this.setShaderParams(
                        target.hueShift,
                        target.saturation,
                        target.brightness,
                        target.weatherIntensity
                    );
                }
            }).call(() => {
                console.log('天气效果激活完成');
            }).start();
        } else {
            // 过渡回正常状态
            const currentParams = {
                hueShift: this.weatherParams.hueShift,
                saturation: this.weatherParams.saturation,
                brightness: this.weatherParams.brightness,
                weatherIntensity: 0.8
            };

            tween(currentParams).to(duration, {
                hueShift: 0,
                saturation: 1.0,
                brightness: 1.0,
                weatherIntensity: 0
            }, {
                easing: 'smooth',
                onUpdate: (target) => {
                    this.setShaderParams(
                        target.hueShift,
                        target.saturation,
                        target.brightness,
                        target.weatherIntensity
                    );
                }
            }).call(() => {
                console.log('天气效果取消完成，恢复原始材质');

                // 完全恢复后，换回原始材质
                if (this.backgroundSprite && this.originalMaterial) {
                    this.backgroundSprite.setMaterial(this.originalMaterial, 0);
                }

                this.isWeatherActive = false;
            }).start();
        }
    }

    /**
     * 创建雪花粒子效果
     */
    createSnowEffect() {
        // 创建雪花节点
        this.snowEffectNode = new Node('SnowEffect');
        this.snowEffectNode.parent = this.node;
        
        // 添加粒子系统组件
        this.snowParticleSystem = this.snowEffectNode.addComponent(ParticleSystem2D);
        
        // 配置粒子系统参数
        // 设置粒子纹理（使用项目中已有的小圆点纹理）
        // 由于我们没有直接的纹理引用，这里先不设置，实际使用时需要在编辑器中指定
        
        // 设置粒子参数
        this.snowParticleSystem.duration = -1; // 永远发射
        this.snowParticleSystem.emissionRate = 50; // 每秒发射50个粒子
        this.snowParticleSystem.life = 5; // 粒子生命周期5秒
        this.snowParticleSystem.lifeVar = 2; // 生命周期变化范围
        this.snowParticleSystem.startColor = { r: 255, g: 255, b: 255, a: 200 };
        this.snowParticleSystem.startColorVar = { r: 0, g: 0, b: 0, a: 50 };
        this.snowParticleSystem.endColor = { r: 255, g: 255, b: 255, a: 0 };
        this.snowParticleSystem.endColorVar = { r: 0, g: 0, b: 0, a: 0 };
        this.snowParticleSystem.angle = -90; // 垂直向下
        this.snowParticleSystem.angleVar = 20; // 角度变化范围
        this.snowParticleSystem.speed = 30; // 移动速度
        this.snowParticleSystem.speedVar = 10; // 速度变化范围
        this.snowParticleSystem.startSize = 10; // 起始大小
        this.snowParticleSystem.startSizeVar = 5; // 起始大小变化范围
        this.snowParticleSystem.endSize = 8; // 结束大小
        this.snowParticleSystem.endSizeVar = 3; // 结束大小变化范围
        this.snowParticleSystem.gravity = { x: 0, y: -30 }; // 重力影响
        
        // 设置发射器位置和大小
        this.snowParticleSystem.sourcePos = { x: 0, y: 300 }; // 从上方发射
        this.snowParticleSystem.posVar = { x: 400, y: 0 }; // 水平分布范围
        
        // 默认隐藏
        this.snowEffectNode.active = false;
        
        console.log('雪花粒子效果创建完成');
    }

    /**
     * 播放雪花特效
     */
    playSnowEffect() {
        if (this.snowEffectNode && this.snowParticleSystem) {
            console.log('播放雪花特效');
            this.snowEffectNode.active = true;
            this.snowParticleSystem.resetSystem(); // 重置粒子系统
        }
    }

    /**
     * 停止雪花特效
     */
    stopSnowEffect() {
        if (this.snowEffectNode && this.snowParticleSystem) {
            console.log('停止雪花特效');
            this.snowParticleSystem.stopSystem();
            // 延迟隐藏节点，确保粒子完全消失
            this.scheduleOnce(() => {
                if (this.snowEffectNode) {
                    this.snowEffectNode.active = false;
                }
            }, 2.0);
        }
    }

    /**
     * 手动设置天气强度（供调试使用）
     */
    setWeatherIntensity(intensity: number) {
        intensity = Math.max(0, Math.min(1, intensity));
        this.setShaderParams(
            this.weatherParams.hueShift * intensity,
            1.0 - (1.0 - this.weatherParams.saturation) * intensity,
            1.0 - (1.0 - this.weatherParams.brightness) * intensity,
            intensity
        );
        
        // 根据天气强度调整雪花密度
        if (this.snowParticleSystem) {
            this.snowParticleSystem.emissionRate = 50 * intensity; // 根据强度调整发射率
        }
    }

    /**
     * 获取当前天气状态
     */
    isWeatherEffectActive() {
        return this.isWeatherActive;
    }
}