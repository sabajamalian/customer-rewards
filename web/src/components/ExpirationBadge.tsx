import { formatPoints } from './PointsBalance';

interface ExpirationBadgeProps {
  points: number;
  expiresAt: string | null;
}

export function ExpirationBadge({ points, expiresAt }: ExpirationBadgeProps) {
  if (points <= 0) return null;

  const nextDate = expiresAt ? ` Next batch on ${new Date(expiresAt).toLocaleDateString()}.` : '';
  return (
    <span className="badge badge-warning">
      {formatPoints(points)} points expire within 30 days.{nextDate}
    </span>
  );
}
