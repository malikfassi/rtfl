"use client";

import React from "react";
import Link from "next/link";
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
import { cn } from "@/app/front/lib/utils";
import { parseMonthString } from "@/app/front/lib/utils/date-formatting";
import { calculateGuessHits } from "@/app/front/lib/utils/hit-counting";
import { getWordColorDeterministic } from "@/app/front/lib/utils/color-management";
import type { Token, Guess, GameState } from "@/app/types";
import type { CalendarViewProps } from "@/app/types";

function dayProgress(game: GameState) {
  const lyricsTokens: Token[] = Array.isArray(game.masked.lyrics) ? game.masked.lyrics : [];
  const validGuesses = game.guesses.filter((g: Guess) => g.valid);
  const segments = calculateGuessHits({ guesses: validGuesses, maskedLyricsParts: lyricsTokens })
    .filter(g => g.hits > 0);
  const total = lyricsTokens.filter(t => t.isToGuess).length;
  const solved = !!game.song;
  return { segments, total, solved, hasGuesses: validGuesses.length > 0 };
}

export function CalendarView({ month, games }: CalendarViewProps) {
  const currentDate = parseMonthString(month);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const gamesMap = new Map(games.map(game => [game.date, game]));

  return (
    <div data-testid="calendar-view" className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-[6px] mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <span key={day} className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-3 pl-[2px]">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[6px]">
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const game = gamesMap.get(dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isFuture = day > new Date();
          const isClickable = isCurrentMonth && !isFuture && !!game;
          const today = isToday(day);

          const { segments, total, solved, hasGuesses } = game
            ? dayProgress(game)
            : { segments: [], total: 0, solved: false, hasGuesses: false };

          const state = isFuture ? 'future' : today ? 'today' : game ? 'played' : 'not-played';

          const cellClasses = cn(
            "relative flex flex-col justify-between h-[74px] max-sm:h-[52px] rounded-[9px] p-[9px_10px] max-sm:p-[7px_6px] border transition-colors duration-150",
            state === 'today' && "bg-rtfl-accent-bg border-rtfl-accent-line",
            state === 'played' && "border-rtfl-line bg-white/[0.022] hover:bg-white/[0.045]",
            state === 'not-played' && "border-rtfl-line bg-transparent",
            state === 'future' && "border-rtfl-line bg-transparent",
          );

          const numberColor = state === 'future' ? 'text-rtfl-ink-ghost' : state === 'not-played' ? 'text-rtfl-ink-2' : 'text-rtfl-ink';

          const cell = (
            <div className={cellClasses}>
              <span className="flex items-center justify-between">
                <span className={cn("font-mono text-[12.5px] max-sm:text-[11px] tabular-nums", numberColor)}>
                  {format(day, "d")}
                </span>
                {solved && <span className="text-[8px] max-sm:text-[7px] text-rtfl-hit">●</span>}
              </span>
              {state !== 'future' && (
                <span className="flex h-[3px] rounded-full overflow-hidden bg-rtfl-raised" style={{ gap: 1 }}>
                  {segments.map(s => (
                    <span
                      key={s.id}
                      style={{ flexGrow: s.hits, flexBasis: 0, background: getWordColorDeterministic(s.word) }}
                    />
                  ))}
                  <span style={{ flexGrow: Math.max(0, total - segments.reduce((sum, s) => sum + s.hits, 0)), flexBasis: 0 }} />
                </span>
              )}
            </div>
          );

          return (
            // Three variants, not two: a day with no game at all, a day whose
            // game this player has guessed on, and one they haven't. The
            // cell renders the same either way - the split exists so the
            // archive's state is addressable from the outside.
            <div
              key={dateStr}
              data-testid={!game ? "game-calendar-day" : hasGuesses ? "game-with-guesses" : "game-without-guesses"}
            >
              {isClickable ? (
                <Link href={`/${dateStr}`} className="block">{cell}</Link>
              ) : cell}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-5 max-sm:flex-col max-sm:items-start max-sm:gap-2 mt-4 pt-4 border-t border-rtfl-line-soft font-sans text-[11px] text-rtfl-ink-2">
        <span className="flex items-center gap-[7px]">
          <span className="w-4 h-[3px] rounded-full bg-rtfl-hit" />solved
        </span>
        <span className="flex items-center gap-[7px]">
          <span className="w-4 h-[3px] rounded-full bg-rtfl-accent" />in progress
        </span>
        <span className="flex items-center gap-[7px]">
          <span className="w-4 h-[3px] rounded-full bg-rtfl-raised" />not played
        </span>
      </div>
    </div>
  );
}
