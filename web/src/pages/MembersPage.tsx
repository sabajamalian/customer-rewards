import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type MemberSummary, type Tier, type TierName } from '../api/client';
import { PointsBalance, formatPoints } from '../components/PointsBalance';
import { TierBadge } from '../components/TierBadge';

const SEARCH_DEBOUNCE_MS = 300;

export function MembersPage() {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<TierName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listTiers()
      .then((data) => setTiers(data.tiers))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .listMembers({ search: debouncedSearch || undefined, tier: selectedTiers })
      .then((data) => {
        if (cancelled) return;
        setMembers(data.members);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedTiers]);

  function toggleTier(tier: TierName) {
    setSelectedTiers((current) =>
      current.includes(tier) ? current.filter((name) => name !== tier) : [...current, tier],
    );
  }

  const filtered = debouncedSearch.length > 0 || selectedTiers.length > 0;

  return (
    <section>
      <header className="page-header">
        <h1>Members</h1>
        <p className="muted">
          {members.length} {filtered ? 'matching' : 'enrolled'} member
          {members.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="filters">
        <input
          className="search-input"
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search members"
        />
        <div className="chips">
          {tiers.map((tier) => (
            <button
              key={tier.name}
              type="button"
              className={selectedTiers.includes(tier.name) ? 'chip chip-active' : 'chip'}
              aria-pressed={selectedTiers.includes(tier.name)}
              onClick={() => toggleTier(tier.name)}
            >
              {tier.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading members…</p>}

      {!loading && !error && members.length === 0 && (
        <p className="empty-state">
          No members match these filters. Try a different search or tier.
        </p>
      )}

      {!loading && !error && members.length > 0 && (
        <>
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
        </>
      )}
    </section>
  );
}
