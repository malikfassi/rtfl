import React from "react";
import { cn } from "@/app/front/lib/utils";

interface GameProgressProps {
  lyricsFound: number;
  lyricsTotal: number;
  titleFound: number;
  titleTotal: number;
  artistFound: number;
  artistTotal: number;
  lyricsWin: boolean;
  titleWin: boolean;
  artistWin: boolean;
  className?: string;
}

export function GameProgress({
  lyricsFound,
  lyricsTotal,
  titleFound,
  titleTotal,
  artistFound,
  artistTotal,
  lyricsWin,
  titleWin,
  artistWin,
  className
}: GameProgressProps) {
  // Calculate percentages
  const lyricsProgress = lyricsTotal > 0 ? lyricsFound / lyricsTotal : 0;
  const lyricsPct = Math.round(lyricsProgress * 100);
  
  // Combined title + artist progress
  const titleArtistFound = titleFound + artistFound;
  const titleArtistTotal = titleTotal + artistTotal;
  const titleArtistProgress = titleArtistTotal > 0 ? titleArtistFound / titleArtistTotal : 0;
  const titleArtistPct = Math.round(titleArtistProgress * 100);
  
  // Win conditions
  const lyricsWinCondition = lyricsProgress >= 0.8;
  const titleArtistWinCondition = titleWin && artistWin;
  const isVictory = lyricsWinCondition || titleArtistWinCondition;

  return (
    <div className={cn("space-y-3 border border-[#ffe29f] bg-[#fffbe6]/60 rounded-xl p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-primary-dark">
        Path to Victory
        {isVictory && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffe29f]/80 text-primary-dark text-xs font-bold border border-[#ffe29f]">
            <svg className="w-4 h-4 text-accent-success" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Victory!
          </span>
        )}
      </div>
      
      {/* Lyrics Path */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-muted">Find 80% of lyrics</span>
          <span className={cn("font-mono", lyricsWinCondition && "text-accent-success font-bold")}>
            {lyricsPct}%
          </span>
        </div>
        {/* 80% threshold marker above the bar */}
        <div className="relative">
          {/* Glowing 80% threshold line */}
          <div
            className="absolute top-0 left-0 h-2 flex items-center pointer-events-none"
            style={{ left: '80%' }}
          >
            <div className="w-0.5 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_2px_rgba(253,224,71,0.7)] ring-2 ring-yellow-200 animate-pulse" />
          </div>
          <div 
            className="absolute -top-3 text-[10px] text-primary-muted/60 transform -translate-x-1/2"
            style={{ left: '80%' }}
          >
            ↓80%
          </div>
          <div className="h-2 bg-primary-muted/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-800",
                lyricsWinCondition ? "bg-accent-success" : "bg-primary/60"
              )}
              style={{ width: `${Math.min(100, lyricsPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* OR Separator */}
      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 h-px bg-primary-muted/20"></div>
        <span className="text-xs text-primary-muted/60 font-medium">OR</span>
        <div className="flex-1 h-px bg-primary-muted/20"></div>
      </div>

      {/* Title + Artist Path */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-muted">Find title + artist</span>
          <span className={cn("font-mono", titleArtistWinCondition && "text-accent-success font-bold")}>
            {titleArtistPct}%
          </span>
        </div>
        <div className="h-2 bg-primary-muted/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-800",
              titleArtistWinCondition ? "bg-accent-success" : "bg-accent-info/60"
            )}
            style={{ width: `${Math.min(100, titleArtistPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-primary-muted/60 mt-0.5">
          <span>Title: {titleFound}/{titleTotal}</span>
          <span>Artist: {artistFound}/{artistTotal}</span>
        </div>
      </div>
    </div>
  );
} 