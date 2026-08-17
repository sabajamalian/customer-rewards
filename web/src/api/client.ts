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

export interface MemberListQuery {
  /** Case insensitive partial match against first name, last name, and email. */
  search?: string;
  /** One or more tier names. A member in any of them matches. */
  tier?: TierName[];
  /** Inclusive bounds on the points balance. */
  minPoints?: number;
  maxPoints?: number;
}

function memberListPath(query: MemberListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  for (const tier of query.tier ?? []) params.append('tier', tier);
  if (query.minPoints !== undefined) params.set('minPoints', String(query.minPoints));
  if (query.maxPoints !== undefined) params.set('maxPoints', String(query.maxPoints));
  const search = params.toString();
  return search ? `/api/members?${search}` : '/api/members';
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  listMembers: (query?: MemberListQuery) =>
    get<{ members: MemberSummary[] }>(memberListPath(query)),
  getMember: (id: string) => get<MemberSummary>(`/api/members/${id}`),
  getTransactions: (id: string) =>
    get<{ transactions: Transaction[] }>(`/api/members/${id}/transactions`),
  listRewards: () => get<{ rewards: Reward[] }>('/api/rewards'),
  listTiers: () => get<{ tiers: Tier[] }>('/api/tiers'),
};
