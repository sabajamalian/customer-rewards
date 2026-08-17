/**
 * Core domain types for the customer rewards platform.
 *
 * Every points value in this system is a whole number. Fractional points are
 * rounded down at the point of award so a member is never credited a fraction.
 */

export type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Tier {
  name: TierName;
  /** Minimum lifetime points required to hold this tier. */
  threshold: number;
  /** Multiplier applied to points earned on a qualifying purchase. */
  multiplier: number;
  /** Customer facing description used on the storefront. */
  description: string;
}

export type TransactionType = 'earn' | 'redeem' | 'adjust';

export interface Transaction {
  id: string;
  memberId: string;
  type: TransactionType;
  /** Positive for `earn`, negative for `redeem`. `adjust` may be either. */
  points: number;
  /** Where the transaction came from, for example `pos:store-114` or `redemption:rw-002`. */
  source: string;
  description: string;
  occurredAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  /** Lifetime points earned. Never decreases on redemption; drives tier placement. */
  lifetimePoints: number;
}

export type RewardCategory = 'Grocery' | 'Apparel' | 'Home' | 'Experience' | 'Charity';

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  stock: number;
  active: boolean;
}

export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface Redemption {
  id: string;
  memberId: string;
  rewardId: string;
  pointsSpent: number;
  status: RedemptionStatus;
  createdAt: string;
}

/** Member enriched with derived values for API responses. */
export interface MemberSummary extends Member {
  tier: TierName;
  pointsBalance: number;
  nextTier: TierName | null;
  pointsToNextTier: number | null;
}
