import { useEffect, useState } from 'react';
import { api, type Reward } from '../api/client';
import { formatPoints } from '../components/PointsBalance';

export function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listRewards()
      .then((data) => setRewards(data.rewards))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <header className="page-header">
        <h1>Reward catalog</h1>
        <p className="muted">Redeem points for credits, merchandise, and experiences.</p>
      </header>

      <div className="card-grid">
        {rewards.map((reward) => (
          <article className="card reward-card" key={reward.id}>
            <span className="card-label">{reward.category}</span>
            <h3>{reward.name}</h3>
            <p className="muted small">{reward.description}</p>
            <strong className="card-value">{formatPoints(reward.pointsCost)} pts</strong>
            <span className={reward.stock > 0 ? 'muted small' : 'error small'}>
              {reward.stock > 0 ? `${reward.stock} available` : 'Out of stock'}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
