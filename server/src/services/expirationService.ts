import type { RewardsStore } from '../data/store.js';
import type { Transaction } from '../types/index.js';

const EXPIRING_SOON_DAYS = 30;

export interface ExpirationSweepSummary {
  membersAffected: number;
  pointsExpired: number;
}

export interface UpcomingExpiration {
  expiringSoonPoints: number;
  nextExpirationAt: string | null;
}

interface EarnBatch {
  transaction: Transaction;
  remainingPoints: number;
  expiresAt: string;
  /** Expiry as an instant, so comparisons stay chronological. */
  expiresAtMs: number;
}

function expirationDate(occurredAt: string): Date | null {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date;
}

export class ExpirationService {
  constructor(private readonly store: RewardsStore) {}

  expirePoints(asOf = new Date()): ExpirationSweepSummary {
    let membersAffected = 0;
    let pointsExpired = 0;

    for (const member of this.store.listMembers()) {
      let availableBalance = Math.max(
        0,
        this.store
          .listTransactions(member.id)
          .reduce((total, transaction) => total + transaction.points, 0),
      );
      let memberPointsExpired = 0;

      for (const batch of this.remainingEarnBatches(member.id)) {
        if (batch.expiresAtMs > asOf.getTime() || availableBalance === 0) {
          continue;
        }

        const points = Math.min(batch.remainingPoints, availableBalance);
        if (points === 0) {
          continue;
        }

        this.store.addTransaction({
          id: this.store.nextId('txn'),
          memberId: member.id,
          type: 'adjust',
          points: -points,
          source: 'system:expiration',
          description: `Points expired from earn on ${batch.transaction.occurredAt.slice(0, 10)}`,
          occurredAt: asOf.toISOString(),
        });
        availableBalance -= points;
        memberPointsExpired += points;
      }

      if (memberPointsExpired > 0) {
        membersAffected += 1;
        pointsExpired += memberPointsExpired;
      }
    }

    return { membersAffected, pointsExpired };
  }

  getUpcomingExpiration(memberId: string, asOf = new Date()): UpcomingExpiration {
    const cutoff = new Date(asOf);
    cutoff.setUTCDate(cutoff.getUTCDate() + EXPIRING_SOON_DAYS);
    const futureBatches = this.remainingEarnBatches(memberId).filter(
      (batch) => batch.expiresAtMs > asOf.getTime(),
    );
    const expiringSoon = futureBatches.filter((batch) => batch.expiresAtMs <= cutoff.getTime());

    return {
      expiringSoonPoints: expiringSoon.reduce((total, batch) => total + batch.remainingPoints, 0),
      nextExpirationAt: futureBatches[0]?.expiresAt ?? null,
    };
  }

  private remainingEarnBatches(memberId: string): EarnBatch[] {
    const transactions = this.store.listTransactions(memberId);
    let spentPoints = transactions
      .filter((transaction) => transaction.points < 0)
      .reduce((total, transaction) => total - transaction.points, 0);

    return transactions
      .filter((transaction) => transaction.type === 'earn' && transaction.points > 0)
      .map((transaction) => ({ transaction, expiresAt: expirationDate(transaction.occurredAt) }))
      .filter(
        (entry): entry is { transaction: Transaction; expiresAt: Date } => entry.expiresAt !== null,
      )
      .sort(
        (a, b) =>
          a.expiresAt.getTime() - b.expiresAt.getTime() ||
          a.transaction.id.localeCompare(b.transaction.id),
      )
      .map(({ transaction, expiresAt }) => {
        const pointsSpent = Math.min(transaction.points, spentPoints);
        spentPoints -= pointsSpent;
        return {
          transaction,
          remainingPoints: transaction.points - pointsSpent,
          expiresAt: expiresAt.toISOString(),
          expiresAtMs: expiresAt.getTime(),
        };
      })
      .filter((batch) => batch.remainingPoints > 0);
  }
}
