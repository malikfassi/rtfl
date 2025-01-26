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
import type { GameState } from "@/app/api/lib/types/game";

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
          const isComplete = game && (
            game.guesses.length / game.masked.lyrics.split(" ").length >= 0.8
          );

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
                <Link href={`/${dateStr}`} className="absolute inset-0 p-2">
                  <div className="mt-4 flex items-center gap-2">
                    {isComplete ? (
                      <Check className="w-4 h-4 text-accent-mint" />
                    ) : (
                      <div className="text-xs text-primary-muted">
                        {Math.round((game.guesses.length / game.masked.lyrics.split(" ").length) * 100)}%
                      </div>
                    )}
                    <div className="text-xs text-primary-muted">
                      {game.guesses.length} guesses
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