import { Router } from 'express';
import type { RewardsStore } from '../data/store.js';
import {
  InvalidMemberFilterError,
  InvalidPurchaseError,
  MemberNotFoundError,
  MemberService,
} from '../services/memberService.js';

export function createMemberRouter(store: RewardsStore): Router {
  const router = Router();
  const members = new MemberService(store);

  router.get('/', (req, res) => {
    try {
      res.json({
        members: members.listMembers({
          search: req.query.search,
          tier: req.query.tier,
          minPoints: req.query.minPoints,
          maxPoints: req.query.maxPoints,
        }),
      });
    } catch (error) {
      if (error instanceof InvalidMemberFilterError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.get('/:id', (req, res) => {
    try {
      res.json(members.getMember(req.params.id));
    } catch (error) {
      if (error instanceof MemberNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.get('/:id/transactions', (req, res) => {
    try {
      res.json({ transactions: members.getTransactions(req.params.id) });
    } catch (error) {
      if (error instanceof MemberNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.post('/:id/earn', (req, res) => {
    try {
      const { amountSpent, source, description, occurredAt } = req.body ?? {};
      const result = members.earnPoints(req.params.id, {
        amountSpent: Number(amountSpent),
        source: String(source ?? ''),
        description,
        occurredAt,
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof MemberNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof InvalidPurchaseError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  return router;
}
