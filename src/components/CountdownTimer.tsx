import { useEffect } from "react";
import { useRoundCountdown } from "../hooks/useRoundCountdown";

interface CountdownTimerProps {
  endTime: string | number | Date;
  className?: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ endTime, className = "", onExpire }: CountdownTimerProps) {
  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(endTime);

  // Determine urgency: less than 2 minutes remaining (120,000 ms)
  const isUrgent = !isExpired && timeLeftMs > 0 && timeLeftMs < 120_000;

  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

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
