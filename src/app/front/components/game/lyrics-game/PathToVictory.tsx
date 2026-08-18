"use client";

import React, { useState, useEffect } from 'react';
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
  // Debug log for incoming props
  console.debug('[PathToVictory] props:', {
    lyricsProgress, titleProgress, artistProgress, totalWords, foundWords, isGameComplete, guesses, highlightedWord, maskedLyricsParts, maskedTitleParts, maskedArtistParts
  });
  
  // Debug log for highlightedWord specifically
  console.debug('[PathToVictory] highlightedWord:', {
    highlightedWord,
    type: typeof highlightedWord,
    isNull: highlightedWord === null,
    isUndefined: highlightedWord === undefined
  });
  
  const [prevFoundWords, setPrevFoundWords] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  
  // Combined title + artist progress
  const titleArtistProgressTotal = (Array.isArray(maskedTitleParts) ? maskedTitleParts.filter(t => t.isToGuess).length : 0) + 
                          (Array.isArray(maskedArtistParts) ? maskedArtistParts.filter(t => t.isToGuess).length : 0);
  
  // Win conditions (matching old logic)
  const lyricsWinCondition = lyricsProgress.total > 0 && (lyricsProgress.found / lyricsProgress.total) >= 0.8;
  const titleWinCondition = titleProgress.total > 0 && titleProgress.found === titleProgress.total;
  const artistWinCondition = artistProgress.total > 0 && artistProgress.found === artistProgress.total;
  const titleArtistWinCondition = titleWinCondition && artistWinCondition;
  const isVictory = lyricsWinCondition || titleArtistWinCondition;

  // Trigger animation when progress is made
  useEffect(() => {
    if (foundWords > prevFoundWords) {
      setAnimateProgress(true);
      setTimeout(() => {
        setAnimateProgress(false);
      }, 1500);
      setPrevFoundWords(foundWords);
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

  return (
    <div 
      data-testid="game-progress"
      className={cn(
        "space-y-3 border border-[#ffe29f] bg-[#fffbe6]/60 rounded-xl p-4 relative overflow-hidden"
      )}
      role="region"
      aria-label="Game Progress"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary-dark">
        Path to Victory
        {isVictory && (
          <span 
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffe29f]/80 text-primary-dark text-xs font-bold border border-[#ffe29f]"
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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-muted">Progress</span>
          <span className="font-mono">{overallPct}%</span>
        </div>
        <SegmentedProgressBar
          guesses={overallGuessHits}
          total={overallTotal}
          highlightedWord={highlightedWord || undefined}
          barHeight="h-3"
          ariaLabel="Game Progress"
        />
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
        @keyframes progressGrow {
          0% {
            transform: scaleX(0.95);
            filter: brightness(1.2);
          }
          50% {
            transform: scaleX(1.05);
            filter: brightness(1.5);
          }
          100% {
            transform: scaleX(1);
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  );
}; 