import React from "react";
import { useRoundCountdown } from "../hooks/useRoundCountdown";

interface CountdownTimerProps {
  endTime: string | number | Date;
  className?: string;
}

export default function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(endTime);

  // Determine urgency: less than 2 minutes remaining (120,000 ms)
  const isUrgent = !isExpired && timeLeftMs > 0 && timeLeftMs < 120_000;

  return (
    <span
      className={`font-mono text-sm font-semibold tabular-nums ${
        isUrgent ? "text-amber-400" : "text-cyan-300"
      } ${className}`}
      aria-live="polite"
    >
      {isExpired ? "Ended" : formattedTime}
    </span>
  );
}
