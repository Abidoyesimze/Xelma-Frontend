import { useEffect } from 'react';
import { useRoundCountdown } from '../hooks/useRoundCountdown';

interface CountdownTimerProps {
  /** End time as ISO string, timestamp, or Date. Optional when `initialSeconds` is provided. */
  endTime?: string | number | Date;
  /** Number of seconds from now to count down. If provided, `endTime` is ignored. */
  initialSeconds?: number;
  /** Optional CSS class */
  className?: string;
  /** Callback invoked once when the timer reaches zero */
  onExpire?: () => void;
}

/**
 * CountdownTimer displays a formatted time remaining until `endTime` or `initialSeconds`.
 * It uses the `useRoundCountdown` hook to manage the interval.
 */
export default function CountdownTimer({
  endTime,
  initialSeconds,
  className = '',
  onExpire,
}: CountdownTimerProps) {
  const target = typeof initialSeconds === 'number'
    ? Date.now() + initialSeconds * 1000
    : endTime;

  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(target);

  // Trigger onExpire once when timer finishes
  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  const isUrgent = !isExpired && timeLeftMs > 0 && timeLeftMs < 120_000;

  return (
    <span
      className={`font-mono text-sm font-semibold tabular-nums ${
        isUrgent ? 'text-amber-400' : 'text-cyan-300'
      } ${className}`}
    >
      {isExpired ? 'Ended' : formattedTime}
    </span>
  );
}
