import type { RewardsStore } from '../data/store.js';
import type { MemberSummary, Transaction } from '../types/index.js';
import { ExpirationService } from './expirationService.js';
import { TierService } from './tierService.js';

export class MemberNotFoundError extends Error {
  constructor(memberId: string) {
    super(`Member ${memberId} not found`);
    this.name = 'MemberNotFoundError';
  }
}

export class InvalidPurchaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPurchaseError';
  }
}

export interface EarnPointsInput {
  /** Purchase total in dollars. Must be greater than zero. */
  amountSpent: number;
  /** Where the purchase happened, for example `pos:store-114`. */
  source: string;
  description?: string;
  occurredAt?: string;
}

export class MemberService {
  private readonly expirationService: ExpirationService;
  private readonly tierService: TierService;

  constructor(
    private readonly store: RewardsStore,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.expirationService = new ExpirationService(store);
    this.tierService = new TierService(store);
  }

  listMembers(): MemberSummary[] {
    return this.store.listMembers().map((member) => this.summarize(member.id));
  }

  getMember(memberId: string): MemberSummary {
    return this.summarize(memberId);
  }

  getTransactions(memberId: string): Transaction[] {
    if (!this.store.findMember(memberId)) {
      throw new MemberNotFoundError(memberId);
    }

    return this.store
      .listTransactions(memberId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  /**
   * Current spendable balance: every transaction ever recorded for the member,
   * summed. Earns are positive, redemptions are negative.
   */
  getPointsBalance(memberId: string): number {
    return this.store
      .listTransactions(memberId)
      .reduce((balance, transaction) => balance + transaction.points, 0);
  }

  /**
   * Awards points for a qualifying purchase. Base rate is one point per dollar,
   * multiplied by the member's current tier multiplier and rounded down.
   */
  earnPoints(memberId: string, input: EarnPointsInput): { member: MemberSummary; transaction: Transaction } {
    const member = this.store.findMember(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }

    if (!Number.isFinite(input.amountSpent) || input.amountSpent <= 0) {
      throw new InvalidPurchaseError('amountSpent must be a positive number');
    }

    if (!input.source || input.source.trim().length === 0) {
      throw new InvalidPurchaseError('source is required');
    }

    const occurredAt = this.normalizeOccurredAt(input.occurredAt);

    const multiplier = this.tierService.multiplierFor(member.lifetimePoints);
    const points = Math.floor(input.amountSpent * multiplier);

    const transaction = this.store.addTransaction({
      id: this.store.nextId('txn'),
      memberId,
      type: 'earn',
      points,
      source: input.source.trim(),
      description: input.description?.trim() || 'Qualifying purchase',
      occurredAt,
    });

    this.store.updateMember({
      ...member,
      lifetimePoints: member.lifetimePoints + points,
    });

    return { member: this.summarize(memberId), transaction };
  }

  /**
   * Rejects a timestamp the rest of the system could not parse, so an earn is
   * never written with an `occurredAt` that later breaks expiration.
   */
  private normalizeOccurredAt(occurredAt: string | undefined): string {
    if (occurredAt === undefined) {
      return new Date().toISOString();
    }

    const parsed = new Date(occurredAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new InvalidPurchaseError('occurredAt must be a valid ISO 8601 date');
    }

    return parsed.toISOString();
  }

  private summarize(memberId: string): MemberSummary {
    const member = this.store.findMember(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }
    const upcomingExpiration = this.expirationService.getUpcomingExpiration(memberId, this.now());

    return {
      ...member,
      tier: this.tierService.tierName(member.lifetimePoints),
      pointsBalance: this.getPointsBalance(memberId),
      ...upcomingExpiration,
      nextTier: this.tierService.nextTier(member.lifetimePoints)?.name ?? null,
      pointsToNextTier: this.tierService.pointsToNextTier(member.lifetimePoints),
    };
  }
}
