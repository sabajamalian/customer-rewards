import type { RewardsStore } from '../data/store.js';
import type { MemberSummary, TierName, Transaction } from '../types/index.js';
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

export class InvalidMemberFilterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMemberFilterError';
  }
}

/**
 * Raw member list filters, as they arrive from the query string. Values are
 * parsed and validated here so the route stays free of business rules.
 */
export interface MemberFilterInput {
  /** Case insensitive partial match against first name, last name, and email. */
  search?: unknown;
  /** One or more tier names. A member in any of them matches. */
  tier?: unknown;
  /** Inclusive lower bound on the points balance. */
  minPoints?: unknown;
  /** Inclusive upper bound on the points balance. */
  maxPoints?: unknown;
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
  private readonly tierService: TierService;

  constructor(private readonly store: RewardsStore) {
    this.tierService = new TierService(store);
  }

  listMembers(filters: MemberFilterInput = {}): MemberSummary[] {
    const search = this.parseSearch(filters.search);
    const tiers = this.parseTiers(filters.tier);
    const minPoints = this.parsePoints(filters.minPoints, 'minPoints');
    const maxPoints = this.parsePoints(filters.maxPoints, 'maxPoints');

    return this.store
      .listMembers()
      .map((member) => this.summarize(member.id))
      .filter((member) => {
        if (search && !this.matchesSearch(member, search)) {
          return false;
        }
        if (tiers.length > 0 && !tiers.includes(member.tier)) {
          return false;
        }
        if (minPoints !== undefined && member.pointsBalance < minPoints) {
          return false;
        }
        if (maxPoints !== undefined && member.pointsBalance > maxPoints) {
          return false;
        }
        return true;
      });
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

    const multiplier = this.tierService.multiplierFor(member.lifetimePoints);
    const points = Math.floor(input.amountSpent * multiplier);

    const transaction = this.store.addTransaction({
      id: this.store.nextId('txn'),
      memberId,
      type: 'earn',
      points,
      source: input.source.trim(),
      description: input.description?.trim() || 'Qualifying purchase',
      occurredAt: input.occurredAt ?? new Date().toISOString(),
    });

    this.store.updateMember({
      ...member,
      lifetimePoints: member.lifetimePoints + points,
    });

    return { member: this.summarize(memberId), transaction };
  }

  private matchesSearch(member: MemberSummary, search: string): boolean {
    return [member.firstName, member.lastName, member.email].some((field) =>
      field.toLowerCase().includes(search),
    );
  }

  private parseSearch(search: unknown): string {
    if (search === undefined) {
      return '';
    }
    if (typeof search !== 'string') {
      throw new InvalidMemberFilterError('search must be a single text value');
    }
    return search.trim().toLowerCase();
  }

  /** Accepts repeated `tier` params and comma separated lists, in any casing. */
  private parseTiers(tier: unknown): TierName[] {
    const values: unknown[] = Array.isArray(tier) ? tier : [tier ?? ''];
    if (!values.every((value): value is string => typeof value === 'string')) {
      throw new InvalidMemberFilterError('tier must be one or more tier names');
    }

    const raw = values
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const known = this.store.listTiers();

    return raw.map((value) => {
      const match = known.find((candidate) => candidate.name.toLowerCase() === value.toLowerCase());
      if (!match) {
        throw new InvalidMemberFilterError(
          `Unknown tier "${value}". Valid tiers: ${known.map((candidate) => candidate.name).join(', ')}`,
        );
      }
      return match.name;
    });
  }

  private parsePoints(value: unknown, field: string): number | undefined {
    if (value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return undefined;
    }

    const parsed =
      typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN;
    if (!Number.isFinite(parsed)) {
      throw new InvalidMemberFilterError(`${field} must be a number`);
    }

    return parsed;
  }

  private summarize(memberId: string): MemberSummary {
    const member = this.store.findMember(memberId);
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }

    return {
      ...member,
      tier: this.tierService.tierName(member.lifetimePoints),
      pointsBalance: this.getPointsBalance(memberId),
      nextTier: this.tierService.nextTier(member.lifetimePoints)?.name ?? null,
      pointsToNextTier: this.tierService.pointsToNextTier(member.lifetimePoints),
    };
  }
}
