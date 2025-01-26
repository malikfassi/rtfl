"use client";

import React from "react";
import { format, isToday, differenceInSeconds, addDays } from "date-fns";
import { useEffect, useState } from "react";

interface DateDisplayProps {
  date: string;
}

export function DateDisplay({ date }: DateDisplayProps) {
  const gameDate = new Date(date);
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState<string>("");

  useEffect(() => {
    if (isToday(gameDate)) {
      const updateCountdown = () => {
        const tomorrow = addDays(new Date().setHours(0, 0, 0, 0), 1);
        const secondsLeft = differenceInSeconds(tomorrow, new Date());
        const hours = Math.floor(secondsLeft / 3600);
        const minutes = Math.floor((secondsLeft % 3600) / 60);
        const seconds = secondsLeft % 60;
        setTimeUntilTomorrow(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [gameDate]);

  if (isToday(gameDate)) {
    return (
      <div>
        <div className="text-sm text-primary-muted animate-pulse">{timeUntilTomorrow}</div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-sm text-primary-muted">{format(gameDate, "EEEE")}</div>
      <div className="text-sm text-primary-muted/70">{format(gameDate, "MMMM d, yyyy")}</div>
    </div>
  );
} 