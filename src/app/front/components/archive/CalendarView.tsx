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
import { parseMonthString } from "@/app/front/lib/utils/date-formatting";

interface CalendarViewProps {
  month: string;
  games: GameState[];
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
          const isFuture = day > new Date();
          // Progress variables for compact display
          let progressPercent = 0;
          let isComplete = false;
          let lyricsComplete = false;
          let titleComplete = false;
          let artistComplete = false;
          let foundTitle = 0;
          let foundArtist = 0;
          let titleHidden: string[] = [];
          let artistHidden: string[] = [];
          let titleArtistPct = 0;
          let hasProgress = false;
          if (game) {
            // Calculate lyrics progress using masked parts
            const lyricsTokens = Array.isArray(game.masked.lyrics) 
              ? game.masked.lyrics 
              : [];
            const hiddenWords = lyricsTokens
              .filter((token: any) => token.isToGuess)
              .map((token: any) => token.value.toLowerCase());
            const totalLyrics = hiddenWords.length;
            const foundWords = Array.from(new Set(
              game.guesses
                .filter((g: any) => g.valid)
                .map((g: any) => g.word.toLowerCase())
            ));
            const foundHiddenWords = hiddenWords.filter((word: string) => foundWords.includes(word));
            const foundLyrics = foundHiddenWords.length;
            progressPercent = totalLyrics > 0 ? Math.round((foundLyrics / totalLyrics) * 100) : 0;
            lyricsComplete = progressPercent >= 80;
            // Check title/artist completion
            const titleTokens = Array.isArray(game.masked.title) ? game.masked.title : [];
            const artistTokens = Array.isArray(game.masked.artist) ? game.masked.artist : [];
            titleHidden = titleTokens.filter((t: any) => t.isToGuess).map((t: any) => t.value.toLowerCase());
            artistHidden = artistTokens.filter((t: any) => t.isToGuess).map((t: any) => t.value.toLowerCase());
            foundTitle = titleHidden.filter((word: string) => foundWords.includes(word)).length;
            foundArtist = artistHidden.filter((word: string) => foundWords.includes(word)).length;
            titleComplete = titleHidden.length > 0 && foundTitle === titleHidden.length;
            artistComplete = artistHidden.length > 0 && foundArtist === artistHidden.length;
            isComplete = lyricsComplete || (titleComplete && artistComplete);
            // For compact display
            const titleArtistTotal = titleHidden.length + artistHidden.length;
            const titleArtistFound = foundTitle + foundArtist;
            titleArtistPct = titleArtistTotal > 0 ? Math.round((titleArtistFound / titleArtistTotal) * 100) : 0;
            // Only show progress if there is at least 1 guess or progress
            hasProgress = game.guesses.filter((g: any) => g.valid).length > 0 || progressPercent > 0 || titleArtistPct > 0;
          }

          // Always clickable if in current month and not in the future
          const isClickable = isCurrentMonth && !isFuture;
          // Gold border for victory
          const dayBorder = isComplete ? 'border-2 border-[#ffe29f] bg-[#fffbe6]/40' : 'border border-primary-muted/20';

          return (
            <div
              key={dateStr}
              className={`
                min-h-[80px] sm:min-h-[100px] p-2 sm:p-4 pt-7 relative flex flex-col items-center justify-center rounded-lg transition-all
                ${isCurrentMonth ? "text-primary" : "text-primary-muted/40"}
                ${isToday(day) ? "bg-white/5" : ""}
                ${isGameDay ? "hover:bg-white/5" : ""}
                ${isFuture ? "opacity-40 pointer-events-none" : ""}
                ${dayBorder}
              `}
            >
              {/* Day number top left, inside padding */}
              <div className="absolute top-2 left-2 text-xs font-mono text-primary-muted/70 select-none pointer-events-none">
                {format(day, "d")}
              </div>
              {/* Trophy top right, inside padding */}
              {isComplete && (
                <div className="absolute top-2 right-2 text-base sm:text-lg select-none pointer-events-none">
                  🏆
                </div>
              )}
              {isClickable && (
                <Link href={`/${dateStr}` as any} className="absolute inset-0 flex flex-col items-center justify-center">
                  {game && hasProgress ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 w-full max-w-full flex-wrap">
                      <span className={
                        `inline-flex items-center px-0.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap ` +
                        (lyricsComplete ? "bg-indigo-100 text-indigo-700 border-indigo-300" : progressPercent > 0 ? "bg-indigo-50 text-indigo-500 border-indigo-200" : "bg-primary-muted/10 text-primary-muted border-primary-muted/20")
                      } style={{minWidth: 0, maxWidth: '100%'}}>
                        <span className="mr-0.5">🎤</span>{progressPercent}%
                      </span>
                      <span className={
                        `inline-flex items-center px-0.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap ` +
                        (titleComplete && artistComplete ? "bg-emerald-100 text-emerald-700 border-emerald-300" : titleArtistPct > 0 ? "bg-emerald-50 text-emerald-500 border-emerald-200" : "bg-primary-muted/10 text-primary-muted border-primary-muted/20")
                      } style={{minWidth: 0, maxWidth: '100%'}}>
                        <span className="mr-0.5">🎶</span>{titleArtistPct}%
                      </span>
                      <span className={
                        `inline-flex items-center px-0.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold border whitespace-nowrap ` +
                        (isComplete ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "bg-yellow-50 text-yellow-600 border-yellow-200")
                      } style={{minWidth: 0, maxWidth: '100%'}}>
                        <span className="mr-0.5">💬</span>{game.guesses.filter((g: any) => g.valid).length}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-primary-muted/30 text-primary-muted/40 text-base font-bold bg-white/10 transition hover:bg-primary-muted/10 mx-auto">+</span>
                    </div>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 