import type { RewardsStore } from '../data/store.js';
import type { Reward } from '../types/index.js';

export class RewardService {
  constructor(private readonly store: RewardsStore) {}

  /** Catalog view. Inactive rewards are hidden from members by default. */
  listRewards(options: { includeInactive?: boolean } = {}): Reward[] {
    return this.store
      .listRewards()
      .filter((reward) => options.includeInactive || reward.active)
      .sort((a, b) => a.pointsCost - b.pointsCost);
  }

  findReward(rewardId: string): Reward | undefined {
    return this.store.findReward(rewardId);
  }

  isAvailable(reward: Reward): boolean {
    return reward.active && reward.stock > 0;
  }
}
