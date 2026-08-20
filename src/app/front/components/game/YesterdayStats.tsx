"use client";

import React from "react";
import { useGameStats } from "@/app/front/hooks/useGameStats";
import { subDays } from "date-fns";
import { cn } from "@/app/front/lib/utils";
import Link from "next/link";
import { TrendingUp, Users, Trophy, Flame, Zap, Target, Star } from "lucide-react";

interface YesterdayStatsProps {
  currentDate: string;
  className?: string;
}

function difficultyFromScore(score: number) {
  if (score >= 8) return { label: "expert", icon: Flame };
  if (score >= 6) return { label: "hard", icon: Zap };
  if (score >= 4) return { label: "medium", icon: Target };
  return { label: "easy", icon: Star };
}

export function YesterdayStats({ currentDate, className }: YesterdayStatsProps) {
  const currentDateObj = new Date(currentDate + 'T00:00:00Z');
  const yesterdayDate = subDays(currentDateObj, 1);
  const y = yesterdayDate.getUTCFullYear();
  const m = String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(yesterdayDate.getUTCDate()).padStart(2, '0');
  const yesterday = `${y}-${m}-${d}`;
  const { data: stats, isLoading } = useGameStats(yesterday);

  if (isLoading || !stats) {
    return null;
  }

  const difficulty = difficultyFromScore(stats.difficultyScore);
  const DifficultyIcon = difficulty.icon;

  return (
    <div className={cn("border border-rtfl-line rounded-[10px] p-4 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 font-sans text-[13px] text-rtfl-ink truncate">Yesterday&apos;s challenge</h3>
        </div>
        <span className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.1em] text-rtfl-ink-2">
          <DifficultyIcon className="w-3 h-3" />
          {difficulty.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <Users className="w-4 h-4 text-rtfl-ink-2" />
          <span className="font-mono font-bold text-[16px] tabular-nums">{stats.totalPlayers}</span>
          <span className="font-sans text-[10px] text-rtfl-ink-2">players</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <TrendingUp className="w-4 h-4 text-rtfl-ink-2" />
          <span className="font-mono font-bold text-[16px] tabular-nums">{stats.averageGuesses}</span>
          <span className="font-sans text-[10px] text-rtfl-ink-2">avg guesses</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Trophy className="w-4 h-4 text-rtfl-ink-2" />
          <span className="font-mono font-bold text-[16px] tabular-nums">{stats.wins}</span>
          <span className="font-sans text-[10px] text-rtfl-ink-2">wins</span>
        </div>
      </div>
      <Link
        href={`/${yesterday}`}
        className="block w-full px-3 py-2 rounded-[8px] border border-rtfl-line text-center font-sans text-[12px] text-rtfl-ink-2 hover:text-rtfl-ink hover:border-rtfl-accent-line transition-colors"
      >
        Try yesterday&apos;s game
      </Link>
    </div>
  );
}
