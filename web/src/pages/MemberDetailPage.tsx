import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type MemberSummary, type Transaction } from '../api/client';
import { formatPoints } from '../components/PointsBalance';
import { TierBadge } from '../components/TierBadge';

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getMember(id), api.getTransactions(id)])
      .then(([memberData, transactionData]) => {
        setMember(memberData);
        setTransactions(transactionData.transactions);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!member) return <p className="muted">Loading member…</p>;

  return (
    <section>
      <Link className="back-link" to="/">
        Back to members
      </Link>

      <header className="page-header">
        <h1>
          {member.firstName} {member.lastName}
        </h1>
        <p className="muted">{member.email}</p>
      </header>

      <div className="card-grid">
        <div className="card">
          <span className="card-label">Tier</span>
          <TierBadge tier={member.tier} />
        </div>
        <div className="card">
          <span className="card-label">Points balance</span>
          <strong className="card-value">{formatPoints(member.pointsBalance)}</strong>
        </div>
        <div className="card">
          <span className="card-label">Lifetime points</span>
          <strong className="card-value">{formatPoints(member.lifetimePoints)}</strong>
        </div>
        <div className="card">
          <span className="card-label">Next tier</span>
          <strong className="card-value">
            {member.nextTier
              ? `${formatPoints(member.pointsToNextTier ?? 0)} to ${member.nextTier}`
              : 'Top tier reached'}
          </strong>
        </div>
      </div>

      <h2>Transaction history</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Source</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{new Date(transaction.occurredAt).toLocaleDateString()}</td>
              <td>{transaction.description}</td>
              <td className="muted small">{transaction.source}</td>
              <td className={transaction.points >= 0 ? 'positive' : 'negative'}>
                {transaction.points >= 0 ? '+' : ''}
                {formatPoints(transaction.points)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
