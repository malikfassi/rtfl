"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { useGameMonth } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { CalendarView } from "@/app/front/components/archive/CalendarView";
import { buildArchiveRoute, getCurrentMonth } from "@/app/front/lib/routes";
import { parseMonthString, getTodayDate } from "@/app/front/lib/utils/date-formatting";
import type { ArchiveContentProps } from "@/app/types";
import type { GameState } from "@/app/types";

function computeStreak(games: GameState[], todayStr: string): number {
  const byDate = new Map(games.map(g => [g.date, g]));
  const dates = [...byDate.keys()].filter(d => d <= todayStr).sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const game = byDate.get(dates[i])!;
    if (game.song) {
      streak += 1;
      continue;
    }
    if (i === 0 && dates[i] === todayStr) continue;
    break;
  }
  return streak;
}

export function ArchiveContent({ month }: ArchiveContentProps) {
  const [playerId, setPlayerId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  const today = new Date();
  const defaultMonth = getCurrentMonth();
  const currentMonth = month || defaultMonth;

  const { data: games, isLoading, error } = useGameMonth(playerId, currentMonth, isClient);

  useEffect(() => {
    setIsClient(true);
    setPlayerId(getOrCreatePlayerId());
  }, []);

  let currentDate: Date;
  let prevMonth: string;
  let nextMonth: string;

  try {
    currentDate = parseMonthString(currentMonth);
    prevMonth = format(subMonths(currentDate, 1), "yyyy-MM");
    nextMonth = format(addMonths(currentDate, 1), "yyyy-MM");
  } catch (error) {
    console.error('Invalid month format:', currentMonth, error);
    return (
      <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex items-center justify-center">
        <div className="text-center py-12">
          <div data-testid="invalid-month" className="text-rtfl-ink-2 text-lg mb-2">Invalid month format</div>
          <div className="text-rtfl-ink-3 text-sm">Please use the YYYY-MM format, e.g. {getCurrentMonth()}</div>
        </div>
      </div>
    );
  }

  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();
  const canNavigateNext = !isCurrentMonth && nextMonth <= format(startOfMonth(today), "yyyy-MM");

  const gamesList = games || [];
  const played = gamesList.filter(g => g.guesses.some(x => x.valid)).length;
  const solved = gamesList.filter(g => !!g.song).length;
  const streak = computeStreak(gamesList, getTodayDate());

  return (
    <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex flex-col items-center max-sm:items-stretch">
      <div data-testid="archive-container" className="w-full max-w-[1000px] border border-rtfl-line rounded-[14px] max-sm:rounded-none max-sm:border-none flex flex-col overflow-hidden m-6 max-sm:m-0 flex-1 min-h-0">
        <div className="flex items-end justify-between gap-6 px-7 py-5 max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:px-5 max-sm:py-[14px] border-b border-rtfl-line-soft bg-rtfl-surface flex-wrap">
          <div className="flex flex-col gap-2">
            <Link href="/" className="font-sans text-[12px] text-rtfl-ink-2 hover:text-rtfl-ink flex items-center gap-[6px]">
              <span className="text-rtfl-ink-3">◀</span>back to today
            </Link>
            {/* The month line IS the archive's title - the redesign's header
                has no separate page heading above it. */}
            <div data-testid="archive-title" className="flex items-baseline gap-[14px]">
              <Link href={buildArchiveRoute(prevMonth)} data-testid="prev-month" aria-label="Previous month" className="text-rtfl-ink-2 hover:text-rtfl-ink text-[13px]">◀</Link>
              <h2 data-testid="month-display" className="m-0 font-mono font-bold text-[22px] max-sm:text-[18px] tracking-[0.01em]">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              {canNavigateNext ? (
                <Link href={buildArchiveRoute(nextMonth)} data-testid="next-month" aria-label="Next month" className="text-rtfl-ink-2 hover:text-rtfl-ink text-[13px]">▶</Link>
              ) : (
                <span data-testid="next-month" aria-label="Next month" aria-disabled="true" className="text-rtfl-ink-ghost text-[13px] cursor-default">▶</span>
              )}
            </div>
          </div>
          <div className="flex gap-[34px] max-sm:gap-[26px]">
            <span className="flex flex-col gap-1 max-sm:flex-row max-sm:items-baseline max-sm:gap-[6px]">
              <span className="font-mono font-bold text-[21px] max-sm:text-[16px] tabular-nums">{played}</span>
              <span className="font-sans text-[10px] max-sm:text-[11px] uppercase tracking-[0.14em] text-rtfl-ink-2">played</span>
            </span>
            <span className="flex flex-col gap-1 max-sm:flex-row max-sm:items-baseline max-sm:gap-[6px]">
              <span className="font-mono font-bold text-[21px] max-sm:text-[16px] tabular-nums text-rtfl-hit">{solved}</span>
              <span className="font-sans text-[10px] max-sm:text-[11px] uppercase tracking-[0.14em] text-rtfl-ink-2">solved</span>
            </span>
            <span className="flex flex-col gap-1 max-sm:flex-row max-sm:items-baseline max-sm:gap-[6px]">
              <span className="font-mono font-bold text-[21px] max-sm:text-[16px] tabular-nums text-rtfl-accent">{streak}</span>
              <span className="font-sans text-[10px] max-sm:text-[11px] uppercase tracking-[0.14em] text-rtfl-ink-2">day streak</span>
            </span>
          </div>
        </div>

        <div className="p-7 max-sm:p-4 overflow-y-auto flex-1 min-h-0">
          {!isClient || isLoading ? (
            <div data-testid="loading-message" className="text-rtfl-ink-2 text-center py-12">Loading games…</div>
          ) : error ? (
            <div data-testid="error-state" className="text-center py-12">
              <div className="text-rtfl-ink-2 text-lg mb-2">Couldn&apos;t load games</div>
              <div className="text-rtfl-ink-3 text-sm">Something went wrong fetching this month. Try again shortly.</div>
            </div>
          ) : (
            <CalendarView month={currentMonth} games={gamesList} />
          )}
        </div>
      </div>
    </div>
  );
}
