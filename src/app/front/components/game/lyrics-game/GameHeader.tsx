import React from 'react';
import { ScrambleTitle } from '../ScrambleTitle';
import { DateDisplay } from '../DateDisplay';
import { cn } from "@/app/front/lib/utils";
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

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <ScrambleTitle title={title} date={date} />
      <div className="flex items-center justify-between">
        {isValidDateFormat ? (
          <DateDisplay date={date} />
        ) : (
          <div className="text-sm text-primary-muted">{date}</div>
        )}
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
      </div>
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