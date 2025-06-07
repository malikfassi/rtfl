"use client";

import React from "react";
import Link from "next/link";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { useMonthGames } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarView } from "@/app/front/components/archive/CalendarView";

interface ArchiveContentProps {
  month?: string;
}

export function ArchiveContent({ month }: ArchiveContentProps) {
  const playerId = getOrCreatePlayerId();
  const currentMonth = month || format(startOfMonth(new Date()), "yyyy-MM");
  const { data: games, isLoading } = useMonthGames(playerId, currentMonth);

  const currentDate = new Date(currentMonth);
  const prevMonth = format(subMonths(currentDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(currentDate, 1), "yyyy-MM");
  
  // Don't allow navigation to future months
  const today = new Date();
  const currentMonthDate = format(startOfMonth(today), "yyyy-MM");
  const canNavigateNext = nextMonth <= currentMonthDate;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-mono">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-2xl font-bold mb-8">Game Archive</h1>
          <div className="text-primary-muted">Loading games...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="max-w-4xl mx-auto p-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href={`/archive/${prevMonth}` as any}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {format(currentDate, "MMMM yyyy")}
          </h1>
          {canNavigateNext ? (
            <Link 
              href={`/archive/${nextMonth}` as any}
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