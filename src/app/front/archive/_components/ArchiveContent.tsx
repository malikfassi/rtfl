"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { useGameMonth } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarView } from "@/app/front/components/archive/CalendarView";
import { ScrambleTitle } from "@/app/front/components/game/ScrambleTitle";
import { buildArchiveRoute, getCurrentMonth } from "@/app/front/lib/routes";
import { parseMonthString } from "@/app/front/lib/utils/date-formatting";

interface ArchiveContentProps {
  month?: string;
}

export function ArchiveContent({ month }: ArchiveContentProps) {
  const [playerId, setPlayerId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  // Always use the current local month as default
  const today = new Date();
  const defaultMonth = getCurrentMonth();
  const currentMonth = month || defaultMonth;
  
  // Only fetch data on client-side
  const { data: games, isLoading } = useGameMonth(playerId, currentMonth, isClient);

  useEffect(() => {
    setIsClient(true);
    setPlayerId(getOrCreatePlayerId());
  }, []);

  const currentDate = parseMonthString(currentMonth);
  const prevMonth = format(subMonths(currentDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(currentDate, 1), "yyyy-MM");

  // Allow navigation to the current month, block only future months
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();
  const canNavigateNext = !isCurrentMonth && nextMonth <= format(startOfMonth(today), "yyyy-MM");

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          {/* Work in progress badge */}
          <div className="flex justify-center mb-2">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border border-yellow-200">Work in progress</span>
          </div>
          {/* Scrambled Title */}
          <div className="flex flex-col items-center justify-center mb-6 mt-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center leading-tight">
              <span className="inline-block align-middle">
                <ScrambleTitle 
                  title="Game Archive"
                  date={currentMonth} 
                />
              </span>
            </h1>
          </div>
          <div className="text-primary-muted text-center">Loading games...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        {/* Work in progress badge */}
        <div className="flex justify-center mb-2">
          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border border-yellow-200">Work in progress</span>
        </div>
        {/* Scrambled Title */}
        <div className="flex flex-col items-center justify-center mb-6 mt-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center leading-tight">
            <span className="inline-block align-middle">
              <ScrambleTitle 
                title="Game Archive"
                date={currentMonth} 
              />
            </span>
          </h1>
          <div className="mt-2 text-xs sm:text-sm text-primary-muted/70 font-mono break-all text-center">
            User ID: <span className="select-all">{playerId}</span>
          </div>
        </div>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href={buildArchiveRoute(prevMonth)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {format(currentDate, "MMMM yyyy")}
          </h1>
          {canNavigateNext ? (
            <Link 
              href={buildArchiveRoute(nextMonth)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="p-2 opacity-30 cursor-not-allowed">
              <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {/* Calendar View */}
        <CalendarView month={currentMonth} games={games || []} />
      </div>
    </div>
  );
} 