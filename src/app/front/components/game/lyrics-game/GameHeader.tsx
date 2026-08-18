"use client";

import React, { useEffect, useState } from 'react';
import { ScrambleTitle } from '../ScrambleTitle';
// Removed unused import
import { addDays, differenceInSeconds } from "date-fns";
import type { GameHeaderProps } from './types';

export const GameHeader = ({ date, isGameWon, guessCount }: GameHeaderProps) => {
  // Validate date format (YYYY-MM-DD)
  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);

  // Countdown logic (from original DateDisplay)
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
    <div data-testid="game-header" className="flex flex-col space-y-2">
      <ScrambleTitle date={date} />
      {isValidDateFormat && (
        <div className="text-xs text-primary-muted/60">
          Next game in {hours}h {minutes}m {seconds}s
        </div>
      )}
      {isGameWon && (
        <div className="text-sm text-accent-success font-medium">
          🎉 Completed with {guessCount} guesses!
        </div>
      )}
    </div>
  );
};
