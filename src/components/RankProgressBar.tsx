import { getRankTiers } from '../data/mockData';

interface RankProgressBarProps {
  xp: number;
}

export default function RankProgressBar({ xp }: RankProgressBarProps) {
  const { current, next, progress } = getRankTiers(xp);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-400">Rank</dt>
        <dd className="text-sm font-bold text-white">{current.name}</dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-400">Experience</dt>
        <dd className="text-sm font-bold text-white">{xp} XP</dd>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{current.label}</span>
          {next && <span>Next: {next.name} ({next.minXp} XP)</span>}
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to ${next ? next.name : 'Max Rank'}`}
          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
