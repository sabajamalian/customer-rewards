import { beforeEach, describe, expect, it } from 'vitest';
import { createStore, type RewardsStore } from '../data/store.js';
import {
  InvalidMemberFilterError,
  InvalidPurchaseError,
  MemberNotFoundError,
  MemberService,
} from '../services/memberService.js';

const REFERENCE_DATE = new Date('2026-08-16T00:00:00.000Z');

describe('MemberService', () => {
  let store: RewardsStore;
  let service: MemberService;

  beforeEach(() => {
    store = createStore(REFERENCE_DATE);
    service = new MemberService(store);
  });

  it('summarizes every seeded member with a tier and a balance', () => {
    const members = service.listMembers();

    expect(members).toHaveLength(8);
    for (const member of members) {
      expect(member.tier).toBeTruthy();
      expect(member.pointsBalance).toBeGreaterThan(0);
      expect(member.pointsBalance).toBe(member.lifetimePoints);
    }
  });

  it('matches search case insensitively and partially across name and email', () => {
    expect(service.listMembers({ search: 'okaf' }).map((member) => member.id)).toEqual([
      'mbr-1001',
    ]);
    expect(service.listMembers({ search: 'AMARA' }).map((member) => member.id)).toEqual([
      'mbr-1001',
    ]);
    expect(service.listMembers({ search: 'priya.raghavan@example.com' })).toHaveLength(1);
    expect(service.listMembers({ search: '@example.com' })).toHaveLength(8);
    expect(service.listMembers({ search: 'nobody' })).toHaveLength(0);
  });

  it('returns the union of the requested tiers', () => {
    const gold = service.listMembers({ tier: 'Gold' });
    const silver = service.listMembers({ tier: 'Silver' });
    const both = service.listMembers({ tier: ['Gold', 'silver'] });

    expect(gold.length).toBeGreaterThan(0);
    expect(silver.length).toBeGreaterThan(0);
    expect(both).toHaveLength(gold.length + silver.length);
    expect(both.every((member) => member.tier === 'Gold' || member.tier === 'Silver')).toBe(true);
    expect(service.listMembers({ tier: 'Gold,Silver' })).toHaveLength(both.length);
  });

  it('applies inclusive point bounds independently', () => {
    const balances = service
      .listMembers()
      .map((member) => member.pointsBalance)
      .sort((a, b) => a - b);
    const lowest = balances[0]!;
    const highest = balances[balances.length - 1]!;

    expect(service.listMembers({ minPoints: lowest })).toHaveLength(balances.length);
    expect(service.listMembers({ minPoints: lowest + 1 })).toHaveLength(balances.length - 1);
    expect(service.listMembers({ maxPoints: highest })).toHaveLength(balances.length);
    expect(service.listMembers({ maxPoints: highest - 1 })).toHaveLength(balances.length - 1);
    expect(
      service
        .listMembers({ minPoints: lowest, maxPoints: lowest })
        .map((member) => member.pointsBalance),
    ).toEqual([lowest]);
  });

  it('combines filters with AND', () => {
    const filtered = service.listMembers({
      search: '@example.com',
      tier: 'Gold',
      minPoints: 0,
      maxPoints: 24999,
    });

    expect(filtered.length).toBeGreaterThan(0);
    for (const member of filtered) {
      expect(member.tier).toBe('Gold');
      expect(member.pointsBalance).toBeLessThanOrEqual(24999);
    }

    expect(service.listMembers({ search: 'okafor', tier: 'Gold' })).toHaveLength(0);
  });

  it('returns the full list when no filters are supplied', () => {
    expect(service.listMembers({})).toHaveLength(8);
    expect(
      service.listMembers({ search: '', tier: '', minPoints: '', maxPoints: '' }),
    ).toHaveLength(8);
  });

  it('rejects an unknown tier and a non numeric bound', () => {
    expect(() => service.listMembers({ tier: 'Diamond' })).toThrow(InvalidMemberFilterError);
    expect(() => service.listMembers({ minPoints: 'lots' })).toThrow(InvalidMemberFilterError);
    expect(() => service.listMembers({ maxPoints: 'lots' })).toThrow(/maxPoints must be a number/);
  });

  it('throws when a member does not exist', () => {
    expect(() => service.getMember('mbr-does-not-exist')).toThrow(MemberNotFoundError);
  });

  it('returns transactions newest first', () => {
    const transactions = service.getTransactions('mbr-1001');

    expect(transactions.length).toBeGreaterThan(0);
    for (let i = 1; i < transactions.length; i += 1) {
      const previous = transactions[i - 1]!;
      const current = transactions[i]!;
      expect(previous.occurredAt >= current.occurredAt).toBe(true);
    }
  });

  it('awards one point per dollar for a Bronze member', () => {
    const seeded = store.findMember('mbr-1001')!;
    store.updateMember({ ...seeded, lifetimePoints: 0 });

    const before = service.getPointsBalance(seeded.id);
    const { transaction, member } = service.earnPoints(seeded.id, {
      amountSpent: 80,
      source: 'pos:store-114',
    });

    expect(transaction.points).toBe(80);
    expect(member.pointsBalance).toBe(before + 80);
  });

  it('applies the tier multiplier and rounds down', () => {
    const member = service.listMembers()[0]!;
    store.updateMember({ ...store.findMember(member.id)!, lifetimePoints: 10000 });

    const { transaction } = service.earnPoints(member.id, {
      amountSpent: 33.75,
      source: 'web:checkout',
    });

    // Gold multiplier is 1.5, so 33.75 * 1.5 = 50.625, floored to 50.
    expect(transaction.points).toBe(50);
  });

  it('rejects a non positive purchase amount', () => {
    expect(() =>
      service.earnPoints('mbr-1001', { amountSpent: 0, source: 'web:checkout' }),
    ).toThrow(InvalidPurchaseError);
  });

  it('rejects a purchase with no source', () => {
    expect(() => service.earnPoints('mbr-1001', { amountSpent: 25, source: '  ' })).toThrow(
      InvalidPurchaseError,
    );
  });

  it('rejects earning for an unknown member', () => {
    expect(() =>
      service.earnPoints('mbr-nope', { amountSpent: 25, source: 'web:checkout' }),
    ).toThrow(MemberNotFoundError);
  });
});
