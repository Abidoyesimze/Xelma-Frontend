import { getRankTiers } from '../data/mockData';

interface RankProgressBarProps {
  xp: number;
}

export default function RankProgressBar({ xp }: RankProgressBarProps) {
  const { current, next, progress } = getRankTiers(xp);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-medium">Rank</span>
          <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-300">
            {current.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <span className="font-medium">Experience</span>
          <span className="font-bold text-white">{xp} XP</span>
        </div>
      </div>

      <div className="space-y-1">
        <div
          role="progressbar"
          aria-valuenow={xp}
          aria-valuemin={current.minXp}
          aria-valuemax={next ? next.minXp : xp}
          aria-label="XP progress to next rank"
          className="h-2 w-full overflow-hidden rounded-full bg-white/5"
        >
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {next && (
          <p className="text-right text-xs text-gray-500">
            {next.minXp - xp} XP to {next.name}
          </p>
        )}
      </div>
    </div>
  );
}
