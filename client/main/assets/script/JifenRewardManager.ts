import { PlayerPrefb } from "./PlayerPrefb";

export class JifenRewardManager {
    // 积分奖励阈值和奖励内容
    private static readonly REWARD_THRESHOLDS = [
        { threshold: 10, rewards: [{ type: 'remind', count: 1 }], description: "10积分: 获得1个提示道具" },
        { threshold: 50, rewards: [{ type: 'remind', count: 1 }, { type: 'time', count: 1 }], description: "50积分: 获得1个提示道具和1个时间道具" },
        { threshold: 100, rewards: [{ type: 'remind', count: 1 }, { type: 'time', count: 1 }, { type: 'layer', count: 1 }], description: "100积分: 获得1个提示道具、1个时间道具和1个找齐道具" },
        { threshold: 200, rewards: [{ type: 'remind', count: 2 }, { type: 'time', count: 1 }, { type: 'brush', count: 1 }], description: "200积分: 获得2个提示道具、1个时间道具和1个刷新道具" },
        { threshold: 400, rewards: [{ type: 'remind', count: 2 }, { type: 'time', count: 2 }, { type: 'brush', count: 1 }, { type: 'layer', count: 1 }], description: "400积分: 获得2个提示道具、2个时间道具、1个刷新道具和1个找齐道具" },
        { threshold: 800, rewards: [{ type: 'remind', count: 3 }, { type: 'time', count: 2 }, { type: 'brush', count: 2 }], description: "800积分: 获得3个提示道具、2个时间道具和2个刷新道具" },
        { threshold: 1600, rewards: [{ type: 'remind', count: 3 }, { type: 'time', count: 3 }, { type: 'brush', count: 2 }, { type: 'layer', count: 1 }], description: "1600积分: 获得3个提示道具、3个时间道具、2个刷新道具和1个找齐道具" },
        { threshold: 3200, rewards: [{ type: 'remind', count: 4 }, { type: 'time', count: 3 }, { type: 'brush', count: 3 }], description: "3200积分: 获得4个提示道具、3个时间道具和3个刷新道具" },
        { threshold: 6400, rewards: [{ type: 'remind', count: 4 }, { type: 'time', count: 4 }, { type: 'brush', count: 3 }, { type: 'layer', count: 2 }], description: "6400积分: 获得4个提示道具、4个时间道具、3个刷新道具和2个找齐道具" },
        { threshold: 10000, rewards: [{ type: 'remind', count: 5 }, { type: 'time', count: 5 }, { type: 'brush', count: 4 }, { type: 'layer', count: 2 }], description: "10000积分: 获得5个提示道具、5个时间道具、4个刷新道具和2个找齐道具" }
    ];

    /**
     * 获取下一个积分奖励信息
     * @param currentJifen 当前积分
     * @returns 奖励信息或null
     */
    static getNextJifenRewardInfo(currentJifen: number): { threshold: number, rewards: { type: string, count: number }[], description: string, canClaim: boolean } | null {
        // 获取已领取的奖励阈值
        const claimedThresholds = this.getClaimedJifenRewardThresholds();
        
        // 查找下一个奖励（已领取的显示下一个，未领取的显示当前可领取的）
        let nextReward = null;
        let canClaim = false;
        
        for (const reward of this.REWARD_THRESHOLDS) {
            // 使用 indexOf 替代 includes 方法
            if (claimedThresholds.indexOf(reward.threshold) === -1) {
                nextReward = reward;
                canClaim = currentJifen >= reward.threshold;
                break;
            }
        }
        
        // 如果所有奖励都已领取，显示最高级别的奖励
        if (!nextReward && this.REWARD_THRESHOLDS.length > 0) {
            const lastReward = this.REWARD_THRESHOLDS[this.REWARD_THRESHOLDS.length - 1];
            nextReward = lastReward;
            canClaim = currentJifen >= lastReward.threshold;
        }
        
        if (nextReward) {
            return {
                threshold: nextReward.threshold,
                rewards: nextReward.rewards,
                description: nextReward.description,
                canClaim: canClaim
            };
        }
        
        return null;
    }

    /**
     * 获取可用的积分奖励（所有未领取的奖励）
     * @param currentJifen 当前积分
     * @returns 可用奖励列表
     */
    static getAvailableJifenReward(currentJifen: number): { threshold: number, rewards: { type: string, count: number }[], description: string, canClaim: boolean }[] {
        const claimedThresholds = this.getClaimedJifenRewardThresholds();
        const availableRewards = [];
        
        for (const reward of this.REWARD_THRESHOLDS) {
            // 使用 indexOf 替代 includes 方法
            if (claimedThresholds.indexOf(reward.threshold) === -1) {
                availableRewards.push({
                    threshold: reward.threshold,
                    rewards: reward.rewards,
                    description: reward.description,
                    canClaim: currentJifen >= reward.threshold
                });
            }
        }
        
        return availableRewards;
    }

    /**
     * 获取已领取的积分奖励阈值
     * @returns 已领取的阈值数组
     */
    static getClaimedJifenRewardThresholds(): number[] {
        const claimed = PlayerPrefb.getInt("jifen_rewards_claimed", 0);
        const thresholds: number[] = [];
        
        // 使用位运算检查哪些阈值已被领取
        // 扩展位运算以支持更多阈值
        if (claimed & 1) thresholds.push(10);
        if (claimed & 2) thresholds.push(50);
        if (claimed & 4) thresholds.push(100);
        if (claimed & 8) thresholds.push(200);
        if (claimed & 16) thresholds.push(400);
        if (claimed & 32) thresholds.push(800);
        if (claimed & 64) thresholds.push(1600);
        if (claimed & 128) thresholds.push(3200);
        if (claimed & 256) thresholds.push(6400);
        if (claimed & 512) thresholds.push(10000);
        
        return thresholds;
    }

    /**
     * 标记积分奖励为已领取
     * @param threshold 奖励阈值
     */
    static markJifenRewardAsClaimed(threshold: number) {
        const claimed = PlayerPrefb.getInt("jifen_rewards_claimed", 0);
        let newClaimed = claimed;
        
        // 使用位运算标记已领取的阈值
        switch (threshold) {
            case 10: newClaimed |= 1; break;
            case 50: newClaimed |= 2; break;
            case 100: newClaimed |= 4; break;
            case 200: newClaimed |= 8; break;
            case 400: newClaimed |= 16; break;
            case 800: newClaimed |= 32; break;
            case 1600: newClaimed |= 64; break;
            case 3200: newClaimed |= 128; break;
            case 6400: newClaimed |= 256; break;
            case 10000: newClaimed |= 512; break;
        }
        
        PlayerPrefb.setInt("jifen_rewards_claimed", newClaimed);
    }
}