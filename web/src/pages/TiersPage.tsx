import { useEffect, useState } from 'react';
import { api, type Tier } from '../api/client';
import { formatPoints } from '../components/PointsBalance';

export function TiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listTiers()
      .then((data) => setTiers(data.tiers))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <header className="page-header">
        <h1>Tiers</h1>
        <p className="muted">Tier placement is based on lifetime points earned.</p>
      </header>

      <div className="card-grid">
        {tiers.map((tier) => (
          <article className="card" key={tier.name}>
            <span className="card-label">{tier.name}</span>
            <strong className="card-value">{formatPoints(tier.threshold)} lifetime pts</strong>
            <p className="muted small">{tier.description}</p>
            <span className="muted small">{tier.multiplier}x earn rate</span>
          </article>
        ))}
      </div>
    </section>
  );
}
