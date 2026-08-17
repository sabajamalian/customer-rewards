import type { Tier, TierName } from '../types/index.js';
import type { RewardsStore } from '../data/store.js';

/**
 * Tier placement is driven by lifetime points earned, not by the current
 * balance. Redeeming rewards spends the balance but never demotes a member.
 */
export class TierService {
  constructor(private readonly store: RewardsStore) {}

  listTiers(): Tier[] {
    return this.store.listTiers().sort((a, b) => a.threshold - b.threshold);
  }

  resolveTier(lifetimePoints: number): Tier {
    const tiers = this.listTiers();
    let resolved = tiers[0];

    for (const tier of tiers) {
      if (lifetimePoints >= tier.threshold) {
        resolved = tier;
      }
    }

    if (!resolved) {
      throw new Error('No tiers configured');
    }

    return resolved;
  }

  nextTier(lifetimePoints: number): Tier | null {
    return this.listTiers().find((tier) => tier.threshold > lifetimePoints) ?? null;
  }

  pointsToNextTier(lifetimePoints: number): number | null {
    const next = this.nextTier(lifetimePoints);
    return next ? next.threshold - lifetimePoints : null;
  }

  /** Multiplier applied when a member earns points on a qualifying purchase. */
  multiplierFor(lifetimePoints: number): number {
    return this.resolveTier(lifetimePoints).multiplier;
  }

  tierName(lifetimePoints: number): TierName {
    return this.resolveTier(lifetimePoints).name;
  }
}
