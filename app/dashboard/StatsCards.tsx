import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';

interface StatsCardProps {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
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

export default function StatsCards({ stats }: { stats: StatsCardProps[] }) {
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
                  <span className="text-white font-bold text-lg">{stat.value}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
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
                          <TrendIcon className="h-4 w-4 flex-shrink-0 self-center" />
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
