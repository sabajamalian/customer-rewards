import { Router } from 'express';
import type { RewardsStore } from '../data/store.js';
import { TierService } from '../services/tierService.js';

export function createTierRouter(store: RewardsStore): Router {
  const router = Router();
  const tiers = new TierService(store);

  router.get('/', (_req, res) => {
    res.json({ tiers: tiers.listTiers() });
  });

  return router;
}
