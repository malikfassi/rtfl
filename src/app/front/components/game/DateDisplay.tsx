"use client";

import React, { useEffect, useState } from "react";
import { formatGameDate, isValidDate } from "@/app/front/lib/utils/date-formatting";
import { addDays, differenceInSeconds } from "date-fns";

interface DateDisplayProps {
  date: string;
  className?: string;
}

export function DateDisplay({ date, className }: DateDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const isValidDateFormat = isValidDate(date);

  useEffect(() => {
    if (!isValidDateFormat) return;

    const updateTimer = () => {
      const tomorrow = addDays(new Date().setHours(0, 0, 0, 0), 1);
      const secondsLeft = differenceInSeconds(tomorrow, new Date());
      setSecondsLeft(secondsLeft);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isValidDateFormat]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  return (
    <div data-testid="date-display" className={className}>
      <div className="text-sm text-primary-muted">
        {formatGameDate(date)}
      </div>
      {isValidDateFormat && (
        <div className="text-xs text-primary-muted/60">
          Next game in {hours}h {minutes}m {seconds}s
        </div>
      )}
    </div>
  );
} 