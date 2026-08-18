"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/front/lib/utils';
import { gameColors } from '@/app/front/lib/utils/color-management';
import { calculateGuessHits } from '@/app/front/lib/utils/hit-counting';
import type { PathToVictoryProps } from './types';
import { SegmentedProgressBar } from './SegmentedProgressBar';

export const PathToVictory = ({ 
  lyricsProgress,
  titleProgress,
  artistProgress,
  totalWords,
  foundWords,
  isGameComplete,
  guesses = [],
  highlightedWord = null,
  maskedLyricsParts = [],
  maskedTitleParts = [],
  maskedArtistParts = [],
  showFullLyrics = false,
  onToggleFullLyrics = () => {},
}: PathToVictoryProps & {
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  showFullLyrics?: boolean;
  onToggleFullLyrics?: (val: boolean) => void;
}) => {
  const [prevFoundWords, setPrevFoundWords] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);
  const prevOverallPctRef = useRef(0);
  const MILESTONES = [25, 50, 75, 100];

  // Combined title + artist progress
  const titleArtistProgressTotal = (Array.isArray(maskedTitleParts) ? maskedTitleParts.filter(t => t.isToGuess).length : 0) + 
                          (Array.isArray(maskedArtistParts) ? maskedArtistParts.filter(t => t.isToGuess).length : 0);
  
  // Win conditions (matching old logic)
  const lyricsWinCondition = lyricsProgress.total > 0 && (lyricsProgress.found / lyricsProgress.total) >= 0.8;
  const titleWinCondition = titleProgress.total > 0 && titleProgress.found === titleProgress.total;
  const artistWinCondition = artistProgress.total > 0 && artistProgress.found === artistProgress.total;
  const titleArtistWinCondition = titleWinCondition && artistWinCondition;
  const isVictory = lyricsWinCondition || titleArtistWinCondition;

  // Trigger a brief highlight flash on the card whenever any progress is made
  useEffect(() => {
    if (foundWords > prevFoundWords) {
      setAnimateProgress(true);
      const t = setTimeout(() => setAnimateProgress(false), 1500);
      setPrevFoundWords(foundWords);
      return () => clearTimeout(t);
    }
  }, [foundWords, prevFoundWords]);

  // Use centralized calculateGuessHits utility for consistent hit counting
  const allGuessHits = calculateGuessHits({
    guesses,
    maskedLyricsParts,
    maskedTitleParts,
    maskedArtistParts,
  });

  // Get unique valid guesses
  const validGuesses = guesses.filter(g => g.valid).map(g => g.word.toLowerCase());

  // Count unique words found in each section
  const lyricsWordsFound = maskedLyricsParts?.filter(token => 
    token.isToGuess && validGuesses.includes(token.value.toLowerCase())
  ).length || 0;

  const titleWordsFound = maskedTitleParts?.filter(token => 
    token.isToGuess && validGuesses.includes(token.value.toLowerCase())
  ).length || 0;

  const artistWordsFound = maskedArtistParts?.filter(token => 
    token.isToGuess && validGuesses.includes(token.value.toLowerCase())
  ).length || 0;

  // Filter hits for each section (for progress bar segments)
  const lyricsGuessHits = allGuessHits
    .filter(g => g.hits > 0)
    .map(g => ({ word: g.word, hits: g.hits }))
    .filter(g => {
      // Only include hits that are in lyrics
      return maskedLyricsParts?.some(token => 
        token.isToGuess && token.value.toLowerCase() === g.word.toLowerCase()
      );
    });

  const titleArtistGuessHits = allGuessHits
    .filter(g => g.hits > 0)
    .map(g => ({ word: g.word, hits: g.hits }))
    .filter(g => {
      // Only include hits that are in title or artist
      return (maskedTitleParts?.some(token => 
        token.isToGuess && token.value.toLowerCase() === g.word.toLowerCase()
      ) || maskedArtistParts?.some(token => 
        token.isToGuess && token.value.toLowerCase() === g.word.toLowerCase()
      ));
    });

  // Overall hits (all sections combined) - for progress bar segments
  const overallGuessHits = allGuessHits
    .filter(g => g.hits > 0)
    .map(g => ({ word: g.word, hits: g.hits }));

  const lyricsTotal = Array.isArray(maskedLyricsParts) ? maskedLyricsParts.filter(t => t.isToGuess).length : 0;
  const titleTotal = Array.isArray(maskedTitleParts) ? maskedTitleParts.filter(t => t.isToGuess).length : 0;
  const artistTotal = Array.isArray(maskedArtistParts) ? maskedArtistParts.filter(t => t.isToGuess).length : 0;
  const titleArtistTotal = titleTotal + artistTotal;
  const overallTotal = lyricsTotal + titleArtistTotal;
  const overallWordsFound = lyricsWordsFound + titleWordsFound + artistWordsFound;

  // Calculate percentages based on unique words found (not total hits)
  const overallPct = overallTotal > 0 ? Math.round((overallWordsFound / overallTotal) * 100) : 0;
  const lyricsPct = lyricsTotal > 0 ? Math.round((lyricsWordsFound / lyricsTotal) * 100) : 0;
  const titleArtistPct = titleArtistTotal > 0 ? Math.round(((titleWordsFound + artistWordsFound) / titleArtistTotal) * 100) : 0;

  // Fire a milestone animation whenever overall progress crosses a tier -
  // an inline animated badge + pulse, not a blocking popup.
  useEffect(() => {
    const prev = prevOverallPctRef.current;
    const crossed = MILESTONES.find(m => prev < m && overallPct >= m);
    prevOverallPctRef.current = overallPct;
    if (crossed) {
      setMilestoneHit(crossed);
      const t = setTimeout(() => setMilestoneHit(null), 1800);
      return () => clearTimeout(t);
    }
  }, [overallPct]);

  return (
    <div 
      data-testid="game-progress"
      className={cn(
        "space-y-3 border border-accent-warning/40 bg-accent-warning/10 rounded-xl p-4 relative overflow-hidden transition-colors duration-500",
        animateProgress && "bg-accent-success/15 border-accent-success/50"
      )}
      role="region"
      aria-label="Game Progress"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary-dark">
        Path to Victory
        {isVictory && (
          <span
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-warning/30 text-primary-dark text-xs font-bold border border-accent-warning/50"
            role="status"
            aria-label="Victory achieved"
          >
            <svg 
              className="w-4 h-4 text-accent-success" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            Victory!
          </span>
        )}
      </div>
      
      {/* Progress Bar Built from Guess History */}
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-muted">Progress</span>
          <span className="font-mono">{overallPct}%</span>
        </div>
        <div className={cn('relative rounded-full', milestoneHit && 'animate-milestone-pulse')}>
          <SegmentedProgressBar
            guesses={overallGuessHits}
            total={overallTotal}
            highlightedWord={highlightedWord || undefined}
            barHeight="h-3"
            ariaLabel="Game Progress"
          />
        </div>
        {milestoneHit && (
          <div
            className="absolute -top-1 right-0 pointer-events-none animate-milestone-badge"
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-lg whitespace-nowrap">
              {milestoneHit === 100 ? '🏆' : '✨'} {milestoneHit}%
            </span>
          </div>
        )}
      </div>

      {/* Lyrics Path */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-muted">Find 80% of lyrics</span>
          <span className={cn("font-mono transition-all duration-700")}>{lyricsPct}%</span>
        </div>
        <div className="relative">
          {/* Glowing 80% threshold line */}
          <div className="absolute top-0 h-2 flex items-center pointer-events-none" style={{ left: '80%', transform: 'translateX(-50%)' }}>
            <div className="w-0.5 h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_2px_rgba(253,224,71,0.7)] ring-2 ring-yellow-200 animate-pulse" aria-hidden="true" />
          </div>
          {/* Arrow and 80% text */}
          <span className="absolute -top-3 text-[10px] text-primary-muted/60" style={{ left: '80%', transform: 'translateX(-50%)', lineHeight: 1 }} aria-hidden="true">↓</span>
          <span className="absolute text-[10px] text-primary-muted/60 ml-0.5" style={{ left: 'calc(80% + 0.2em)', top: '-14.1px' }} aria-hidden="true">80%</span>
          <SegmentedProgressBar
            guesses={lyricsGuessHits}
            total={lyricsTotal}
            highlightedWord={highlightedWord || undefined}
            barHeight="h-2"
            ariaLabel="Lyrics progress"
          />
        </div>
        <div className="flex justify-between text-[10px] text-primary-muted/60 mt-0.5">
          <span className="transition-all duration-700">Lyrics: {lyricsWordsFound}/{lyricsTotal}</span>
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
          <span className={cn("font-mono transition-all duration-700")}>{titleArtistPct}%</span>
        </div>
        <SegmentedProgressBar
          guesses={titleArtistGuessHits}
          total={titleArtistTotal}
          highlightedWord={highlightedWord || undefined}
          barHeight="h-2"
          ariaLabel="Title and artist progress"
        />
        <div className="flex justify-between text-[10px] text-primary-muted/60 mt-0.5">
          <span className="transition-all duration-700">Title: {titleWordsFound}/{titleTotal}</span>
          <span className="transition-all duration-700">Artist: {artistWordsFound}/{artistTotal}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes milestone-badge {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.75);
          }
          20% {
            opacity: 1;
            transform: translateY(-4px) scale(1.1);
          }
          35% {
            transform: translateY(-6px) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-18px) scale(0.9);
          }
        }
        :global(.animate-milestone-badge) {
          animation: milestone-badge 1.8s ease-out forwards;
        }

        @keyframes milestone-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 hsl(var(--primary) / 0.5);
          }
          50% {
            box-shadow: 0 0 0 6px hsl(var(--primary) / 0);
          }
        }
        :global(.animate-milestone-pulse) {
          animation: milestone-pulse 0.9s ease-out 2;
        }
      `}</style>
    </div>
  );
}; 