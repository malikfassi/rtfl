"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/app/front/lib/utils";
import { calculateGuessHits } from "@/app/front/lib/utils/hit-counting";
import { getWordColorDeterministic } from "@/app/front/lib/utils/color-management";

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
}

const GuessHistoryComponent = ({ 
  guesses, 
  maskedLyrics,
  maskedTitle,
  maskedArtist,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  onWordHover,
  selectedGuess,
  onGuessSelect
}: GuessHistoryProps) => {
  const [hideZeroHits, setHideZeroHits] = useState(false);
  
  // Count hits for each guess using the utility
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
    <div data-testid="guess-history">
      {filteredGuesses.length > 0 && (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setHideZeroHits(!hideZeroHits)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            "border transition-all duration-200",
            hideZeroHits
              ? "bg-primary/10 border-primary/30 text-primary-dark hover:bg-primary/15"
              : "bg-transparent border-border text-primary-muted hover:border-primary/30 hover:text-primary-dark"
          )}
        >
          {hideZeroHits ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {hideZeroHits ? "Show all guesses" : "Hide no-hit guesses"}
        </button>
      </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filteredGuesses.map((g) => {
          const index = guesses.findIndex(guess => guess.id === g.id);
          const color = getWordColorDeterministic(g.word);
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
              onMouseEnter={() => {
                if (!isSelected) {
                  onWordHover(g.word);
                }
              }}
              onMouseLeave={() => {
                if (!isSelected) {
                  onWordHover(null);
                }
              }}
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
};

export const GuessHistory = React.memo(GuessHistoryComponent);
