import { beforeEach, describe, expect, it } from 'vitest';
import { createStore, type RewardsStore } from '../data/store.js';
import {
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

  it('rejects an unparseable occurredAt without recording the earn', () => {
    const before = service.getPointsBalance('mbr-1001');
    const lifetimeBefore = store.findMember('mbr-1001')!.lifetimePoints;

    expect(() =>
      service.earnPoints('mbr-1001', {
        amountSpent: 25,
        source: 'web:checkout',
        occurredAt: 'not-a-date',
      }),
    ).toThrow(InvalidPurchaseError);
    expect(service.getPointsBalance('mbr-1001')).toBe(before);
    expect(store.findMember('mbr-1001')!.lifetimePoints).toBe(lifetimeBefore);
  });

  it('normalizes a valid occurredAt to an ISO timestamp', () => {
    const { transaction } = service.earnPoints('mbr-1001', {
      amountSpent: 25,
      source: 'web:checkout',
      occurredAt: '2026-03-01T05:30:00+05:30',
    });

    expect(transaction.occurredAt).toBe('2026-03-01T00:00:00.000Z');
  });

  it('generates transaction ids that do not collide with seeded ids', () => {
    const { transaction } = service.earnPoints('mbr-1001', {
      amountSpent: 25,
      source: 'web:checkout',
    });

    const matches = store
      .listTransactions()
      .filter((candidate) => candidate.id === transaction.id);
    expect(matches).toHaveLength(1);
  });
});
