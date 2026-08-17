import { Router } from 'express';
import type { RewardsStore } from '../data/store.js';
import { ExpirationService } from '../services/expirationService.js';

export function createMaintenanceRouter(store: RewardsStore): Router {
  const router = Router();
  const expiration = new ExpirationService(store);

  router.post('/expire-points', (_req, res) => {
    res.json(expiration.expirePoints());
  });

  return router;
}
