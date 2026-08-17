export type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Tier {
  name: TierName;
  threshold: number;
  multiplier: number;
  description: string;
}

export interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  lifetimePoints: number;
  tier: TierName;
  pointsBalance: number;
  nextTier: TierName | null;
  pointsToNextTier: number | null;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'adjust';
  points: number;
  source: string;
  description: string;
  occurredAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  stock: number;
  active: boolean;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  listMembers: () => get<{ members: MemberSummary[] }>('/api/members'),
  getMember: (id: string) => get<MemberSummary>(`/api/members/${id}`),
  getTransactions: (id: string) =>
    get<{ transactions: Transaction[] }>(`/api/members/${id}/transactions`),
  listRewards: () => get<{ rewards: Reward[] }>('/api/rewards'),
  listTiers: () => get<{ tiers: Tier[] }>('/api/tiers'),
};
