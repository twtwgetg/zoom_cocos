import { PlayerPrefb } from "./PlayerPrefb";

export class JifenRewardManager {
    // 积分奖励阈值和奖励内容
    private static readonly REWARD_THRESHOLDS = [
        { threshold: 80, rewards: [{ type: 'remind', count: 1 }], description: "80积分: 获得1个提示道具" },
        { threshold: 200, rewards: [{ type: 'time', count: 1 }], description: "200积分: 获得1个时间道具" },
        { threshold: 450, rewards: [{ type: 'brush', count: 1 }], description: "450积分: 获得1个刷新道具" },
        { threshold: 800, rewards: [{ type: 'layer', count: 1 }], description: "800积分: 获得1个找齐道具" },
        { threshold: 1300, rewards: [{ type: 'remind', count: 1 }, { type: 'time', count: 1 }], description: "1300积分: 获得1个提示道具和1个时间道具" },
        { threshold: 2000, rewards: [{ type: 'remind', count: 1 }, { type: 'brush', count: 1 }], description: "2000积分: 获得1个提示道具和1个刷新道具" },
        { threshold: 3000, rewards: [{ type: 'time', count: 1 }, { type: 'layer', count: 1 }], description: "3000积分: 获得1个时间道具和1个找齐道具" },
        { threshold: 4500, rewards: [{ type: 'time', count: 1 }, { type: 'brush', count: 1 }], description: "4500积分: 获得1个时间道具和1个刷新道具" },
        { threshold: 6500, rewards: [{ type: 'remind', count: 2 }, { type: 'brush', count: 1 }], description: "6500积分: 获得2个提示道具和1个刷新道具" },
        { threshold: 9000, rewards: [{ type: 'time', count: 2 }, { type: 'layer', count: 1 }], description: "9000积分: 获得2个时间道具和1个找齐道具" }
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
        if (claimed & 1) thresholds.push(80);
        if (claimed & 2) thresholds.push(200);
        if (claimed & 4) thresholds.push(450);
        if (claimed & 8) thresholds.push(800);
        if (claimed & 16) thresholds.push(1300);
        if (claimed & 32) thresholds.push(2000);
        if (claimed & 64) thresholds.push(3000);
        if (claimed & 128) thresholds.push(4500);
        if (claimed & 256) thresholds.push(6500);
        if (claimed & 512) thresholds.push(9000);
        
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
            case 80: newClaimed |= 1; break;
            case 200: newClaimed |= 2; break;
            case 450: newClaimed |= 4; break;
            case 800: newClaimed |= 8; break;
            case 1300: newClaimed |= 16; break;
            case 2000: newClaimed |= 32; break;
            case 3000: newClaimed |= 64; break;
            case 4500: newClaimed |= 128; break;
            case 6500: newClaimed |= 256; break;
            case 9000: newClaimed |= 512; break;
        }
        
        PlayerPrefb.setInt("jifen_rewards_claimed", newClaimed);
    }
}
