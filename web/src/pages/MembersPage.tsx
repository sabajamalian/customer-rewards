import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type MemberSummary } from '../api/client';
import { ExpirationBadge } from '../components/ExpirationBadge';
import { PointsBalance, formatPoints } from '../components/PointsBalance';
import { TierBadge } from '../components/TierBadge';

export function MembersPage() {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listMembers()
      .then((data) => setMembers(data.members))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading members…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <header className="page-header">
        <h1>Members</h1>
        <p className="muted">{members.length} enrolled members</p>
      </header>

      <table className="table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Tier</th>
            <th>Balance</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <Link to={`/members/${member.id}`}>
                  {member.firstName} {member.lastName}
                </Link>
                <div className="muted small">{member.email}</div>
                <ExpirationBadge
                  points={member.expiringSoonPoints}
                  expiresAt={member.nextExpirationAt}
                />
              </td>
              <td>
                <TierBadge tier={member.tier} />
              </td>
              <td>{formatPoints(member.pointsBalance)}</td>
              <td className="muted small">
                {member.nextTier
                  ? `${formatPoints(member.pointsToNextTier ?? 0)} to ${member.nextTier}`
                  : 'Top tier'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PointsBalance
        points={members.reduce((total, member) => total + member.pointsBalance, 0)}
        label="total outstanding points"
      />
    </section>
  );
}
