import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createStore, type RewardsStore } from '../data/store.js';

const REFERENCE_DATE = new Date('2026-08-16T00:00:00.000Z');

describe('API', () => {
  let store: RewardsStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = createStore(REFERENCE_DATE);
    app = createApp(store);
  });

  it('reports health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('lists members', async () => {
    const response = await request(app).get('/api/members');
    expect(response.status).toBe(200);
    expect(response.body.members).toHaveLength(8);
    expect(response.body.members[0]).toHaveProperty('tier');
  });

  it('filters the member list by search, tier, and points', async () => {
    const search = await request(app).get('/api/members?search=okafor');
    expect(search.status).toBe(200);
    expect(search.body.members).toHaveLength(1);

    const tiers = await request(app).get('/api/members?tier=Gold&tier=Platinum');
    expect(tiers.status).toBe(200);
    expect(
      tiers.body.members.every((member: { tier: string }) =>
        ['Gold', 'Platinum'].includes(member.tier),
      ),
    ).toBe(true);

    const bounded = await request(app).get('/api/members?minPoints=0&maxPoints=0');
    expect(bounded.status).toBe(200);
    expect(bounded.body.members).toHaveLength(0);
  });

  it('rejects invalid member filters', async () => {
    const tier = await request(app).get('/api/members?tier=Diamond');
    expect(tier.status).toBe(400);
    expect(tier.body.error).toContain('Diamond');

    const bound = await request(app).get('/api/members?minPoints=abc');
    expect(bound.status).toBe(400);
  });

  it('returns 404 for an unknown member', async () => {
    const response = await request(app).get('/api/members/mbr-nope');
    expect(response.status).toBe(404);
  });

  it('returns member transactions', async () => {
    const response = await request(app).get('/api/members/mbr-1001/transactions');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.transactions)).toBe(true);
  });

  it('records an earn transaction', async () => {
    const response = await request(app)
      .post('/api/members/mbr-1001/earn')
      .send({ amountSpent: 42, source: 'app:checkout', description: 'Weekly grocery run' });

    expect(response.status).toBe(201);
    expect(response.body.transaction.type).toBe('earn');
    expect(response.body.transaction.points).toBeGreaterThan(0);
  });

  it('rejects an invalid earn payload', async () => {
    const response = await request(app)
      .post('/api/members/mbr-1001/earn')
      .send({ amountSpent: -5, source: 'app:checkout' });

    expect(response.status).toBe(400);
  });

  it('lists only active rewards by default', async () => {
    const response = await request(app).get('/api/rewards');
    expect(response.status).toBe(200);
    expect(response.body.rewards.every((reward: { active: boolean }) => reward.active)).toBe(true);
  });

  it('includes inactive rewards when asked', async () => {
    const response = await request(app).get('/api/rewards?includeInactive=true');
    expect(response.body.rewards.length).toBeGreaterThan(
      (await request(app).get('/api/rewards')).body.rewards.length,
    );
  });

  it('lists tiers', async () => {
    const response = await request(app).get('/api/tiers');
    expect(response.status).toBe(200);
    expect(response.body.tiers).toHaveLength(4);
  });
});
