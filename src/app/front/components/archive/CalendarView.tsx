"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek
} from "date-fns";
import type { GameState } from "@/app/api/lib/types/game-state";

interface CalendarViewProps {
  month: string;
  games: GameState[];
}

export function CalendarView({ month, games }: CalendarViewProps) {
  const currentDate = new Date(month);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const gamesMap = new Map(games.map(game => [game.date, game]));

  return (
    <div className="rounded-lg bg-white/5 p-4">
      <div className="grid grid-cols-7 gap-px">
        {/* Week day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-2 text-center text-sm text-primary-muted font-medium">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const game = gamesMap.get(dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isGameDay = Boolean(game);
          
          // Calculate proper progress if game exists
          let progressPercent = 0;
          let isComplete = false;
          
          if (game) {
            // Calculate lyrics progress using masked parts
            const lyricsTokens = Array.isArray(game.masked.lyrics) 
              ? game.masked.lyrics 
              : [];
            const hiddenWords = lyricsTokens
              .filter((token: any) => token.isToGuess)
              .map((token: any) => token.value.toLowerCase());
            
            const foundWords = Array.from(new Set(
              game.guesses
                .filter((g: any) => g.valid)
                .map((g: any) => g.word.toLowerCase())
            ));
            
            const foundHiddenWords = hiddenWords.filter((word: string) => foundWords.includes(word));
            progressPercent = hiddenWords.length > 0 ? Math.round((foundHiddenWords.length / hiddenWords.length) * 100) : 0;
            
            // Check if complete (80% lyrics OR title+artist complete)
            const lyricsComplete = progressPercent >= 80;
            
            // Check title/artist completion
            const titleTokens = Array.isArray(game.masked.title) ? game.masked.title : [];
            const artistTokens = Array.isArray(game.masked.artist) ? game.masked.artist : [];
            
            const titleHidden = titleTokens.filter((t: any) => t.isToGuess).map((t: any) => t.value.toLowerCase());
            const artistHidden = artistTokens.filter((t: any) => t.isToGuess).map((t: any) => t.value.toLowerCase());
            
            const titleComplete = titleHidden.length > 0 && titleHidden.every((word: string) => foundWords.includes(word));
            const artistComplete = artistHidden.length > 0 && artistHidden.every((word: string) => foundWords.includes(word));
            
            isComplete = lyricsComplete || (titleComplete && artistComplete);
          }

          return (
            <div
              key={dateStr}
              className={`
                min-h-[80px] p-2 relative
                ${isCurrentMonth ? "text-primary" : "text-primary-muted/40"}
                ${isToday(day) ? "bg-white/5" : ""}
                ${isGameDay ? "hover:bg-white/5" : ""}
              `}
            >
              <div className="text-sm">{format(day, "d")}</div>
              {game && (
                <Link href={`/game/${dateStr}` as any} className="absolute inset-0 p-2">
                  <div className="mt-4 flex items-center gap-2">
                    {isComplete ? (
                      <Check className="w-4 h-4 text-accent-success" />
                    ) : (
                      <div className="text-xs text-primary-muted">
                        {progressPercent}%
                      </div>
                    )}
                    <div className="text-xs text-primary-muted">
                      {game.guesses.filter((g: any) => g.valid).length} guesses
                    </div>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 