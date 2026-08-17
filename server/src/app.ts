import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import type { RewardsStore } from './data/store.js';
import { store as defaultStore } from './data/store.js';
import { createMemberRouter } from './routes/members.js';
import { createRewardRouter } from './routes/rewards.js';
import { createTierRouter } from './routes/tiers.js';

export function createApp(store: RewardsStore = defaultStore): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'customer-rewards-api' });
  });

  app.use('/api/members', createMemberRouter(store));
  app.use('/api/rewards', createRewardRouter(store));
  app.use('/api/tiers', createTierRouter(store));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
