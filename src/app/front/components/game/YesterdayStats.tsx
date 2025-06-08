"use client";

import React from "react";
import { useGameStats } from "@/app/front/hooks/useGameStats";
import { format, subDays } from "date-fns";
import { cn } from "@/app/front/lib/utils";
import Link from "next/link";
import { TrendingUp, Users, Target, Clock, Info } from "lucide-react";

interface YesterdayStatsProps {
  currentDate: string;
  className?: string;
}

export function YesterdayStats({ currentDate, className }: YesterdayStatsProps) {
  // Use currentDate for yesterday calculation, always in UTC
  const currentDateObj = new Date(currentDate + 'T00:00:00Z');
  const yesterdayDate = subDays(currentDateObj, 1);
  // Format as UTC yyyy-MM-dd
  const y = yesterdayDate.getUTCFullYear();
  const m = String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(yesterdayDate.getUTCDate()).padStart(2, '0');
  const yesterday = `${y}-${m}-${d}`;
  const { data: stats, isLoading } = useGameStats(yesterday);

  if (isLoading || !stats) {
    return null; // Don't show anything if there's no data
  }

  const getDifficultyLabel = (score: number) => {
    if (score >= 8) return {
      label: "Expert",
      color: "text-accent-error",
      emoji: "🔥",
      explanation: "Very challenging – few people found many words."
    };
    if (score >= 6) return {
      label: "Hard",
      color: "text-accent-warning",
      emoji: "⚡",
      explanation: "Challenging – required many guesses to solve."
    };
    if (score >= 4) return {
      label: "Medium",
      color: "text-accent-info",
      emoji: "🎯",
      explanation: "Moderate difficulty – balanced challenge."
    };
    return {
      label: "Easy",
      color: "text-accent-success",
      emoji: "🌟",
      explanation: "Accessible – most players found words quickly."
    };
  };

  const difficulty = getDifficultyLabel(stats.difficultyScore);

  return (
    <div className={cn("bg-gradient-to-r from-primary-muted/5 to-accent-info/5 rounded-lg p-4 border border-primary-muted/10 relative", className)}>
      <div className="flex justify-center mb-2">
        <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border border-yellow-200">Work in progress</span>
      </div>
      <div className="flex items-center justify-between mb-3 gap-x-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-primary-dark mb-1 truncate">Yesterday's Challenge</h3>
          <p className="text-xs text-primary-muted truncate">How did other players do?</p>
        </div>
        <div className="flex items-center min-w-0">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full bg-white/50 flex items-center gap-x-1 min-w-0 relative group cursor-pointer", difficulty.color)}>
            <span className="shrink-0">{difficulty.emoji}</span>
            <span className="truncate max-w-[5.5rem] md:max-w-none">{difficulty.label}</span>
            <Info className="w-3 h-3 shrink-0" />
            {/* Tooltip */}
            <span className="absolute left-1/2 top-full z-20 -translate-x-1/2 mt-1 px-2 py-1 rounded border border-primary-muted/30 bg-background text-xs font-mono text-primary-dark max-w-xs whitespace-pre break-all hidden group-hover:block group-focus-within:block group-active:block">
              {difficulty.explanation}
            </span>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2" title="Unique players who played yesterday's game.">
          <Users className="w-3 h-3 text-accent-info" />
          <div>
            <div className="text-sm font-medium text-primary-dark">{stats.totalPlayers}</div>
            <div className="text-xs text-primary-muted">players</div>
          </div>
        </div>
        <div className="flex items-center gap-2" title="Average number of guesses per player.">
          <TrendingUp className="w-3 h-3 text-accent-warning" />
          <div>
            <div className="text-sm font-medium text-primary-dark">{stats.averageGuesses}</div>
            <div className="text-xs text-primary-muted">avg guesses</div>
          </div>
        </div>
        <div className="flex items-center gap-2 col-span-2" title="Average % of lyrics found by players who completed the game.">
          <Target className="w-3 h-3 text-accent-success" />
          <div>
            <div className="text-sm font-medium text-primary-dark">{stats.averageLyricsCompletionForWinners}%</div>
            <div className="text-xs text-primary-muted">avg completion (winners)</div>
          </div>
        </div>
      </div>

      <Link 
        href={`/${yesterday}` as any}
        className="block w-full px-3 py-2 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info text-center rounded-md transition-colors text-sm font-medium"
      >
        🕐 Try Yesterday's Game
      </Link>
    </div>
  );
} 