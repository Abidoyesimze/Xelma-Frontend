import { useRoundCountdown } from "../hooks/useRoundCountdown";

interface CountdownTimerProps {
  endTime: string | number | Date;
  className?: string;
}

/**
 * CountdownTimer displays a formatted time remaining until `endTime`.
 * It uses the `useRoundCountdown` hook to manage the interval.
 */
export default function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(endTime);

  // Urgent style when less than 2 minutes remain
  const isUrgent = !isExpired && timeLeftMs > 0 && timeLeftMs < 120_000;

  return (
    <span
      className={`font-mono text-sm font-semibold tabular-nums ${
        isUrgent ? "text-amber-400" : "text-cyan-300"
      } ${className}`}
    >
      {isExpired ? "Ended" : formattedTime}
    </span>
  );
}
