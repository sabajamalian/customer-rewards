import { beforeEach, describe, expect, it } from 'vitest';
import { createStore, type RewardsStore } from '../data/store.js';
import { ExpirationService } from '../services/expirationService.js';

const REFERENCE_DATE = new Date('2026-08-16T00:00:00.000Z');

describe('ExpirationService', () => {
  let store: RewardsStore;
  let service: ExpirationService;

  beforeEach(() => {
    store = createStore(REFERENCE_DATE);
    service = new ExpirationService(store);
  });

  it('expires an earn exactly twelve months after it occurred', () => {
    const earn = store.addTransaction({
      id: store.nextId('txn'),
      memberId: 'mbr-1001',
      type: 'earn',
      points: 100,
      source: 'test:purchase',
      description: 'Boundary purchase',
      occurredAt: '2025-08-16T12:00:00.000Z',
    });

    service.expirePoints(new Date('2026-08-16T11:59:59.999Z'));
    expect(
      store
        .listTransactions(earn.memberId)
        .some((transaction) => transaction.description.includes('2025-08-16')),
    ).toBe(false);

    service.expirePoints(new Date('2026-08-16T12:00:00.000Z'));
    const expiration = store
      .listTransactions(earn.memberId)
      .find((transaction) => transaction.description.includes('2025-08-16'));

    expect(expiration).toMatchObject({
      type: 'adjust',
      points: -100,
      source: 'system:expiration',
    });
    expect(store.listTransactions(earn.memberId)).toContainEqual(earn);
  });

  it('does not expire points again on a second sweep', () => {
    const first = service.expirePoints(REFERENCE_DATE);
    const second = service.expirePoints(REFERENCE_DATE);

    expect(first.membersAffected).toBeGreaterThan(0);
    expect(first.pointsExpired).toBeGreaterThan(0);
    expect(second).toEqual({ membersAffected: 0, pointsExpired: 0 });
  });

  it('never drives the spendable balance below zero', () => {
    const memberId = 'mbr-1001';
    const earnedPoints = store
      .listTransactions(memberId)
      .reduce((total, transaction) => total + transaction.points, 0);
    store.addTransaction({
      id: store.nextId('txn'),
      memberId,
      type: 'redeem',
      points: -(earnedPoints - 50),
      source: 'test:redemption',
      description: 'Almost all points spent',
      occurredAt: REFERENCE_DATE.toISOString(),
    });

    service.expirePoints(new Date('2030-08-16T00:00:00.000Z'));

    const balance = store
      .listTransactions(memberId)
      .reduce((total, transaction) => total + transaction.points, 0);
    expect(balance).toBe(0);
  });
});
