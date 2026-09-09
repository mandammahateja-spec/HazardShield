interface RiskBadgeProps {
  level: 'high' | 'medium' | 'low';
  showLabel?: boolean;
}

export default function RiskBadge({ level, showLabel = true }: RiskBadgeProps) {
  const styles = {
    high: 'bg-red-100 text-risk-high border-red-200',
    medium: 'bg-yellow-100 text-risk-medium border-yellow-200',
    low: 'bg-green-100 text-risk-low border-green-200',
  };

  const labels = {
    high: 'High Risk',
    medium: 'Medium Risk',
    low: 'Low Risk',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[level]}`}>
      <span className={`w-2 h-2 rounded-full mr-2 bg-current`}></span>
      {showLabel ? labels[level] : level.toUpperCase()}
    </span>
  );
}
