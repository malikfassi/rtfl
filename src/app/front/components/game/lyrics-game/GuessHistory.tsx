"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";
import { calculateGuessHits } from "@/app/front/lib/utils/hit-counting";

interface Guess {
  id: string;
  gameId: string;
  playerId: string;
  word: string;
  createdAt: Date;
  valid: boolean;
}

interface GuessHistoryProps {
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  maskedLyrics?: string;
  maskedTitle?: string;
  maskedArtist?: string;
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
  colors: Array<{ bg: string; text: string; }>;
}

export function GuessHistory({ 
  guesses, 
  maskedLyrics,
  maskedTitle,
  maskedArtist,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  onWordHover,
  selectedGuess,
  onGuessSelect,
  colors
}: GuessHistoryProps) {
  const [hideZeroHits, setHideZeroHits] = useState(false);
  
  // Count hits for each guess using the new utility
  const guessHits = calculateGuessHits({
    guesses,
    maskedLyrics,
    maskedTitle,
    maskedArtist,
    maskedTitleParts,
    maskedArtistParts,
    maskedLyricsParts,
  });

  // Filter and sort guesses
  const filteredGuesses = [...guessHits]
    .reverse()
    .filter(g => !hideZeroHits || g.hits >= 1);

  return (
    <div className="border-t border-primary-muted/10 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setHideZeroHits(!hideZeroHits)}
          className={cn(
            "text-xs transition-colors duration-200",
            hideZeroHits 
              ? "text-accent-error hover:text-accent-error/80" 
              : "text-primary-muted hover:text-primary-dark"
          )}
        >
          {hideZeroHits ? "Show all guesses" : "Hide no-hit guesses"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filteredGuesses.map((g, i) => {
          const index = guesses.findIndex(guess => guess.id === g.id);
          const color = colors[index % colors.length];
          const isSelected = g.id === selectedGuess?.id;
          
          return (
            <div
              key={g.id}
              className={cn(
                "group inline-flex items-center gap-1 text-sm transition-all duration-200",
                "px-2 py-1 rounded-md cursor-pointer",
                g.valid 
                  ? cn(
                      "bg-primary-muted/5 hover:bg-primary-muted/10",
                      isSelected && "bg-primary-muted/20",
                      color.text
                    )
                  : "text-accent-error/50 line-through bg-accent-error/5"
              )}
              onClick={() => {
                if (g.valid) {
                  onGuessSelect(isSelected ? null : { id: g.id, word: g.word });
                  onWordHover(null);
                }
              }}
              onMouseEnter={() => !isSelected && onWordHover(g.word)}
              onMouseLeave={() => !isSelected && onWordHover(null)}
            >
              <span className="font-medium">{g.word}</span>
              {g.valid && (
                <span className={cn(
                  "text-xs opacity-70 group-hover:opacity-100 transition-opacity duration-200",
                  color.text
                )}>
                  ×{g.hits}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 