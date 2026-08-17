import type { Member, Redemption, Reward, Tier, Transaction } from '../types/index.js';
import { buildTransactions, MEMBERS, REWARDS, TIERS } from './seed.js';

/**
 * In-memory data store.
 *
 * The application talks to this interface rather than to a concrete database,
 * so a real persistence layer can be swapped in without touching services or
 * routes. Everything is synchronous on purpose: the demo runs entirely in
 * process and async plumbing would only add noise.
 */
export interface RewardsStore {
  listTiers(): Tier[];
  listMembers(): Member[];
  findMember(id: string): Member | undefined;
  updateMember(member: Member): Member;
  listTransactions(memberId?: string): Transaction[];
  addTransaction(transaction: Transaction): Transaction;
  listRewards(): Reward[];
  findReward(id: string): Reward | undefined;
  updateReward(reward: Reward): Reward;
  listRedemptions(memberId?: string): Redemption[];
  addRedemption(redemption: Redemption): Redemption;
  nextId(prefix: string): string;
  reset(referenceDate?: Date): void;
}

class InMemoryRewardsStore implements RewardsStore {
  private members = new Map<string, Member>();
  private transactions: Transaction[] = [];
  private rewards = new Map<string, Reward>();
  private redemptions: Redemption[] = [];
  private counters = new Map<string, number>();

  constructor(referenceDate?: Date) {
    this.reset(referenceDate);
  }

  reset(referenceDate = new Date()): void {
    this.members = new Map(MEMBERS.map((member) => [member.id, { ...member }]));
    this.rewards = new Map(REWARDS.map((reward) => [reward.id, { ...reward }]));
    this.transactions = buildTransactions(referenceDate).map((txn) => ({ ...txn }));
    this.redemptions = [];
    this.counters = new Map();

    for (const transaction of this.transactions) {
      this.rememberId(transaction.id);
    }

    for (const member of this.members.values()) {
      member.lifetimePoints = this.transactions
        .filter((txn) => txn.memberId === member.id && txn.points > 0)
        .reduce((total, txn) => total + txn.points, 0);
    }
  }

  listTiers(): Tier[] {
    return TIERS.map((tier) => ({ ...tier }));
  }

  listMembers(): Member[] {
    return [...this.members.values()].map((member) => ({ ...member }));
  }

  findMember(id: string): Member | undefined {
    const member = this.members.get(id);
    return member ? { ...member } : undefined;
  }

  updateMember(member: Member): Member {
    this.members.set(member.id, { ...member });
    return { ...member };
  }

  listTransactions(memberId?: string): Transaction[] {
    const all = memberId
      ? this.transactions.filter((txn) => txn.memberId === memberId)
      : this.transactions;
    return all.map((txn) => ({ ...txn }));
  }

  addTransaction(transaction: Transaction): Transaction {
    this.transactions.push({ ...transaction });
    return { ...transaction };
  }

  listRewards(): Reward[] {
    return [...this.rewards.values()].map((reward) => ({ ...reward }));
  }

  findReward(id: string): Reward | undefined {
    const reward = this.rewards.get(id);
    return reward ? { ...reward } : undefined;
  }

  updateReward(reward: Reward): Reward {
    this.rewards.set(reward.id, { ...reward });
    return { ...reward };
  }

  listRedemptions(memberId?: string): Redemption[] {
    const all = memberId
      ? this.redemptions.filter((redemption) => redemption.memberId === memberId)
      : this.redemptions;
    return all.map((redemption) => ({ ...redemption }));
  }

  addRedemption(redemption: Redemption): Redemption {
    this.redemptions.push({ ...redemption });
    return { ...redemption };
  }

  nextId(prefix: string): string {
    const current = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, current);
    return `${prefix}-${String(current).padStart(5, '0')}`;
  }

  /**
   * Keeps the id counters ahead of ids that already exist, so generated ids
   * never collide with seeded ones.
   */
  private rememberId(id: string): void {
    const separator = id.lastIndexOf('-');
    if (separator < 1) {
      return;
    }

    const prefix = id.slice(0, separator);
    const sequence = Number(id.slice(separator + 1));
    if (!Number.isInteger(sequence)) {
      return;
    }

    this.counters.set(prefix, Math.max(this.counters.get(prefix) ?? 0, sequence));
  }
}

export function createStore(referenceDate?: Date): RewardsStore {
  return new InMemoryRewardsStore(referenceDate);
}

/** Process wide store used by the running server. Tests build their own. */
export const store: RewardsStore = createStore();
