import { Router } from 'express';
import type { RewardsStore } from '../data/store.js';
import { RewardService } from '../services/rewardService.js';

export function createRewardRouter(store: RewardsStore): Router {
  const router = Router();
  const rewards = new RewardService(store);

  router.get('/', (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ rewards: rewards.listRewards({ includeInactive }) });
  });

  router.get('/:id', (req, res) => {
    const reward = rewards.findReward(req.params.id);
    if (!reward) {
      res.status(404).json({ error: `Reward ${req.params.id} not found` });
      return;
    }
    res.json(reward);
  });

  return router;
}
