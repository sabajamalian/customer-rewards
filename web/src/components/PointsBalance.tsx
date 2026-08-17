export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function PointsBalance({ points, label }: { points: number; label?: string }) {
  return (
    <div className="points">
      <span className="points-value">{formatPoints(points)}</span>
      <span className="points-label">{label ?? 'points'}</span>
    </div>
  );
}
