import { _decorator, Component, Node } from 'cc';
import { Main } from './main';
const { ccclass, property } = _decorator;

// 声明微信小程序全局对象
declare const wx: any;

@ccclass('InterstitialAdManager')
export class InterstitialAdManager extends Component {
    @property({ tooltip: "字节跳动插屏广告位ID" })
    adUnitId: string = "10ikr1q7pg73885i42"; // 使用你提供的广告位ID

    private interstitialAd: any = null;
    private isAdLoaded: boolean = false;
    private isAdShowing: boolean = false;

    start() {
        this.initInterstitialAd();
    }

    protected onLoad(): void {
        // 监听游戏结束事件，显示插屏广告
        Main.RegistEvent("game_win", (x) => {
            console.log("游戏胜利，准备显示插屏广告");
            this.showInterstitialAd();
            return null;
        });

        Main.RegistEvent("game_lose", (x) => {
            console.log("游戏失败，准备显示插屏广告");
            this.showInterstitialAd();
            return null;
        });
    }

    /**
     * 初始化插屏广告
     */
    private initInterstitialAd() {
        if (typeof wx === 'undefined') {
            console.log("非字节跳动环境，不加载插屏广告");
            return;
        }

        // 创建插屏广告实例
        this.interstitialAd = wx.createInterstitialAd({
            adUnitId: this.adUnitId
        });

        // 监听广告加载成功
        this.interstitialAd.onLoad(() => {
            this.isAdLoaded = true;
            console.log("插屏广告加载成功");
        });

        // 监听广告加载失败
        this.interstitialAd.onError((err: any) => {
            this.isAdLoaded = false;
            console.error("插屏广告错误:", err);
            
            // 加载失败后，延迟重新加载
            setTimeout(() => {
                this.loadAd();
            }, 30000); // 30秒后重试
        });

        // 监听广告显示
        this.interstitialAd.onShow(() => {
            this.isAdShowing = true;
            console.log("插屏广告显示成功");
        });

        // 监听广告关闭
        this.interstitialAd.onClose(() => {
            this.isAdShowing = false;
            console.log("插屏广告已关闭");
            
            // 广告关闭后重新加载，为下次显示做准备
            this.loadAd();
        });

        // 初始加载广告
        this.loadAd();
    }

    /**
     * 加载广告（供初始化和重新加载使用）
     */
    private loadAd() {
        if (this.interstitialAd && !this.isAdLoaded && !this.isAdShowing) {
            console.log("正在加载插屏广告...");
            this.interstitialAd.load().catch((err: any) => {
                console.error("插屏广告加载失败：", err);
            });
        }
    }

    /**
     * 显示插屏广告
     */
    public showInterstitialAd() {
        if (this.isAdShowing) {
            console.log("插屏广告正在显示中，跳过本次显示");
            return;
        }

        if (this.isAdLoaded && this.interstitialAd) {
            console.log("显示插屏广告");
            this.interstitialAd.show().catch((err: any) => {
                console.error("插屏广告显示失败:", err);
                
                // 显示失败后重新加载
                this.loadAd();
            });
        } else {
            console.log("插屏广告未就绪，无法显示");
            // 如果广告未加载，尝试重新加载
            this.loadAd();
        }
    }

    onDestroy() {
        // 销毁广告实例
        if (this.interstitialAd) {
            this.interstitialAd.destroy();
            this.interstitialAd = null;
        }
    }
}