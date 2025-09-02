import { _decorator, Component, Node, UITransform, view } from 'cc';
import { tools } from './tools';
import { Main } from './main'; 
const { ccclass, property } = _decorator;

// 声明tt全局对象（若已配置类型文件可省略）
declare const wx: any;

@ccclass('BannerAdManager')
export class BannerAdManager extends Component {
    @property({ tooltip: "抖音Banner广告位ID" })
    adUnitId: string = "你的Banner广告位ID"; // 替换为实际广告位ID
 
    private bannerAd: any = null;
    private isAdLoaded: boolean = false;

    start() { 
    }
    protected onEnable(): void {
        console.log("BannerAdManager onEnable");
        if(this.isAdLoaded){
            this.adaptToNode();
            this.showBannerAd();
        }
        else{
            this.initBannerAd();
        }
        
    }
    protected onDisable(): void {
        console.log("BannerAdManager onDisable");
        this.hideBannerAd();
    }
    /**
     * 初始化Banner广告
     */
    private initBannerAd() {
        if (typeof _wx === 'undefined') {
            console.log("非抖音环境，不加载Banner广告");
            return;
        }
        

        // 创建广告实例时先不指定位置，后续动态计算
        this.bannerAd = wx.createBannerAd({
            adUnitId: this.adUnitId,
        });

        // 监听加载成功，根据目标Node设置位置和尺寸
        this.bannerAd.onLoad(() => {
            console.log("Banner广告加载成功");
            this.isAdLoaded = true;
            this.adaptToNode();
            this.showBannerAd(); 
        });

        this.bannerAd.onError((err: any) => {
            console.error("Banner广告错误:", err);
        });

        // 监听屏幕尺寸变化，重新调整位置和尺寸
        view.on('canvas - resize', this.adaptToNode, this);
    }
    get targetNode()
    {
        return this.node; 
    }
    /**
     * 适配目标Node的位置和尺寸
     */
    private adaptToNode() {
        if (!this.bannerAd ||!this.targetNode) return;

        const targetUITransform = this.targetNode.getComponent(UITransform);
        if (!targetUITransform) {
            console.error("目标Node没有UITransform组件，无法获取尺寸信息");
            return;
        }

        // 获取目标Node的位置和尺寸
        const targetPosition = this.targetNode.getPosition();
        const targetWidth = targetUITransform.width;
        const targetHeight = targetUITransform.height;

        // 设置广告位置
        this.bannerAd.style.left = targetPosition.x;
        this.bannerAd.style.top = targetPosition.y;

        // 设置广告尺寸
        this.bannerAd.style.width = targetWidth;
        this.bannerAd.style.height = targetHeight;
    }

    /**
     * 显示广告
     */
    public showBannerAd() {
        if (this.bannerAd && this.isAdLoaded) {
            this.bannerAd.show().catch((err: any) => {
                console.error("Banner显示失败:", err);
            });
        }
    }

    /**
     * 隐藏广告
     */
    public hideBannerAd() {
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }

    onDestroy() {
        if (this.bannerAd) {
            this.bannerAd.destroy();
        }
        view.off('canvas - resize', this.adaptToNode, this);
    }
}