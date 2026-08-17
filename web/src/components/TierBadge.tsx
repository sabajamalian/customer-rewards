import type { TierName } from '../api/client';

const TIER_CLASS: Record<TierName, string> = {
  Bronze: 'badge badge-bronze',
  Silver: 'badge badge-silver',
  Gold: 'badge badge-gold',
  Platinum: 'badge badge-platinum',
};

export function TierBadge({ tier }: { tier: TierName }) {
  return <span className={TIER_CLASS[tier]}>{tier}</span>;
}
