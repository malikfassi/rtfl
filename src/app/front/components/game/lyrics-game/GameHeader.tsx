import React, { useEffect, useState } from 'react';
import { ScrambleTitle } from '../ScrambleTitle';
import { cn } from "@/app/front/lib/utils";
import { addDays, differenceInSeconds } from "date-fns";
import type { GameHeaderProps } from "@/app/types";

export function GameHeader({
  title,
  date,
  playerId,
  isAdmin = false,
  onChooseSong,
  hideChooseSongButton = false,
  className
}: GameHeaderProps) {
  // Validate date format (YYYY-MM-DD)
  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);

  // Countdown logic (from DateDisplay)
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
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
    <div data-testid="game-header" className={cn("flex flex-col space-y-2", className)}>
      <ScrambleTitle title={title} date={date} />
      <div className="flex items-center gap-x-2">
        <div className="text-[10px] font-medium text-accent-info">Player ID</div>
        <div 
          className="text-[10px] font-mono text-accent-info/80" 
          style={{paddingTop: 0, paddingBottom: 0}} 
          title={playerId}
        >
          #{playerId}
        </div>
      </div>
      {isValidDateFormat && (
        <div className="text-xs text-primary-muted/60">
          Next game in {hours}h {minutes}m {seconds}s
        </div>
      )}
      {isAdmin && !hideChooseSongButton && (
        <button
          onClick={onChooseSong}
          className="text-accent-info hover:text-accent-info/80"
        >
          Choose Song
        </button>
      )}
    </div>
  );
} 