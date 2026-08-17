import { describe, expect, it } from 'vitest';
import { createStore } from '../data/store.js';
import { TierService } from '../services/tierService.js';

describe('TierService', () => {
  const service = new TierService(createStore(new Date('2026-08-16T00:00:00.000Z')));

  it('lists tiers ordered by threshold', () => {
    expect(service.listTiers().map((tier) => tier.name)).toEqual([
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
    ]);
  });

  it('places a brand new member in Bronze', () => {
    expect(service.tierName(0)).toBe('Bronze');
  });

  it('places a member at the exact threshold in the higher tier', () => {
    expect(service.tierName(2500)).toBe('Silver');
    expect(service.tierName(10000)).toBe('Gold');
    expect(service.tierName(25000)).toBe('Platinum');
  });

  it('keeps a member in the tier below until the next threshold is reached', () => {
    expect(service.tierName(2499)).toBe('Bronze');
    expect(service.tierName(9999)).toBe('Silver');
  });

  it('reports the next tier and the gap to reach it', () => {
    expect(service.nextTier(0)?.name).toBe('Silver');
    expect(service.pointsToNextTier(0)).toBe(2500);
  });

  it('reports no next tier for Platinum members', () => {
    expect(service.nextTier(40000)).toBeNull();
    expect(service.pointsToNextTier(40000)).toBeNull();
  });

  it('returns the earn multiplier for the resolved tier', () => {
    expect(service.multiplierFor(0)).toBe(1);
    expect(service.multiplierFor(2500)).toBe(1.25);
    expect(service.multiplierFor(10000)).toBe(1.5);
    expect(service.multiplierFor(25000)).toBe(2);
  });
});
