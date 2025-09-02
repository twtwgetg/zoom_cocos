import { _decorator, Component, Node, Button, Label } from 'cc';
import { Main } from './main';
const { ccclass, property } = _decorator;

// 声明tt全局对象
declare const tt: any;
declare const wx: any;
@ccclass('RewardVideoManager')
export class RewardVideoManager extends Component {
    @property({ tooltip: "抖音激励视频广告位ID" })
    adUnitId: string = "你的激励视频广告位ID"; // 替换为实际广告位ID

    // @property({ tooltip: "观看奖励：金币数量" })
    // rewardCoins: number = 100;

    @property({ tooltip: "用于显示广告状态的标签" })
    statusLabel: Label = null;

    private rewardAd: any = null; // 激励视频实例
    private isAdLoaded: boolean = false; // 广告是否加载完成
    private isWatching: boolean = false; // 是否正在观看广告

    start() {
        // 初始化激励视频广告
        this.initRewardAd();

        // 绑定观看广告按钮事件（示例）
        const watchButton = this.node.getComponent(Button);
        if (watchButton) {
            watchButton.node.on('click', this.watchAdForReward, this);
        }

        // 更新状态显示
        this.updateStatus("广告初始化中...");
    }
    protected onLoad(): void {
        Main.RegistEvent("event_watchvideo", (x) => {
            this.watchAdForReward();
        });
    }
    /**
     * 初始化激励视频广告
     */
    private initRewardAd() {
        if (typeof wx === 'undefined') {
            this.updateStatus("非正式环境，无法加载广告");
            return;
        }

        // 创建激励视频实例
        this.rewardAd = wx.createRewardedVideoAd({
            adUnitId: this.adUnitId
        });

        // 监听广告加载成功
        this.rewardAd.onLoad(() => {
            this.isAdLoaded = true;
            this.updateStatus("广告已就绪，点击观看");
            console.log("激励视频加载成功");
        });

        // 监听广告加载失败
        this.rewardAd.onError((err: any) => {
            this.isAdLoaded = false;
            this.updateStatus(`广告加载失败：${err.errMsg}`);
            console.error("激励视频错误：", err);

            // 失败后尝试重新加载（30秒后）
            setTimeout(() => {
                this.loadAd();
            }, 30000);
        });

        // 监听广告关闭（核心：判断是否发放奖励）
        this.rewardAd.onClose((res: any) => {
            this.isWatching = false;
            this.updateStatus("广告已关闭");

            // 广告播放完成（完整观看）才发放奖励
            if (res && res.isEnded) {
                this.updateStatus(`观看完成`); 
                Main.DispEvent("event_reward",true);
            } else {
                this.updateStatus("未完整观看，无奖励");

                Main.DispEvent("event_reward", false);
            }

            // 关闭后重新加载广告，为下一次播放做准备
            this.loadAd();
        });

        // 初始加载广告
        this.loadAd();
    }

    /**
     * 加载广告（供初始化和重新加载使用）
     */
    private loadAd() {
        if (this.rewardAd && !this.isAdLoaded) {
            this.updateStatus("正在加载广告...");
            this.rewardAd.load().catch((err: any) => {
                console.error("广告加载失败：", err);
            });
        }
    }

    /**
     * 观看广告获取奖励（按钮点击触发）
     */
    public watchAdForReward() {
        if (this.isWatching) {
            this.updateStatus("正在观看广告，请稍候...");
            return;
        }

        if (this.isAdLoaded && this.rewardAd) {
            this.isWatching = true;
            this.updateStatus("广告播放中...");
            
            // 显示广告
            this.rewardAd.show().catch((err: any) => {
                this.isWatching = false;
                this.updateStatus(`广告显示失败：${err.errMsg}`);
                console.error("广告显示失败：", err);
                
                // 显示失败后重新加载
                this.loadAd();
            });
        } else {
            this.updateStatus("广告未就绪，请稍候...");
        }
    } 
    /**
     * 更新状态显示
     */
    private updateStatus(text: string) {
        console.log(text);
        if (this.statusLabel) {
            this.statusLabel.string = text;
        }
    }

    onDestroy() {
        // 销毁广告实例
        if (this.rewardAd) {
            this.rewardAd.destroy();
            this.rewardAd = null;
        }
    }
}
