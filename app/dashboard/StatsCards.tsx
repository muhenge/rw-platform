import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';

interface StatsCardProps {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const trendIcons = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  neutral: MinusIcon,
};

const trendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  neutral: 'text-gray-400',
};

interface StatsCardsProps {
  stats: StatsCardProps[];
  isLoading?: boolean;
}

export default function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const TrendIcon = stat.trend ? trendIcons[stat.trend] : null;
        const trendColor = stat.trend ? trendColors[stat.trend] : '';

        return (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-all hover:shadow-md"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  {stat.icon || (
                    <span className="text-white font-bold text-lg">{stat.value}</span>
                  )}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    {stat.trend && TrendIcon && (
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${trendColor}`}
                      >
                        <TrendIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      </div>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
