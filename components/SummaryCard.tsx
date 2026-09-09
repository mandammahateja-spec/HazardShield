interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'red' | 'yellow' | 'green' | 'blue';
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
}: SummaryCardProps) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
  };

  const iconColorClasses = {
    red: 'text-risk-high',
    yellow: 'text-risk-medium',
    green: 'text-risk-low',
    blue: 'text-accent',
  };

  const trendColorClasses = {
    up: 'text-risk-high',
    down: 'text-risk-low',
    neutral: 'text-gray-500',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-xl p-6 hover:shadow-hover transition-all duration-300 transform hover:scale-105 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`${iconColorClasses[color]} text-3xl opacity-80`}>
          {icon}
        </div>
      </div>

      {trend && trendValue && (
        <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${trendColorClasses[trend]}`}>
          <span>{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
