import { formatPoints } from './PointsBalance';

interface ExpirationBadgeProps {
  points: number;
  expiresAt: string | null;
}

export function ExpirationBadge({ points, expiresAt }: ExpirationBadgeProps) {
  if (points <= 0) return null;

  const date = expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString()}` : '';
  return (
    <span className="badge badge-warning">
      {formatPoints(points)} points expire{date}
    </span>
  );
}
