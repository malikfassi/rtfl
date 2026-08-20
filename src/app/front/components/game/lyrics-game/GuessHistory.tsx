"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";
import { calculateGuessHits } from "@/app/front/lib/utils/hit-counting";
import { getWordColorDeterministic } from "@/app/front/lib/utils/color-management";
import type { Token } from "@/app/types";

interface GuessHistoryProps {
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  maskedTitleParts?: Token[];
  maskedArtistParts?: Token[];
  maskedLyricsParts?: Token[];
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
}

const GuessHistoryComponent = ({
  guesses,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  onWordHover,
  selectedGuess,
  onGuessSelect
}: GuessHistoryProps) => {
  const [hideZeroHits, setHideZeroHits] = useState(false);

  const guessHits = calculateGuessHits({
    guesses,
    maskedTitleParts,
    maskedArtistParts,
    maskedLyricsParts,
  });

  const filteredGuesses = [...guessHits]
    .reverse()
    .filter(g => !hideZeroHits || g.hits >= 1);

  return (
    <div data-testid="guess-history" className="flex flex-col gap-3 min-h-0">
      {guessHits.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-rtfl-ink-2">
            {guessHits.length} {guessHits.length === 1 ? 'guess' : 'guesses'}
          </span>
          <button
            type="button"
            onClick={() => setHideZeroHits(v => !v)}
            className={cn(
              "font-sans text-[11px] rounded-full px-[10px] py-1 border transition-colors duration-150",
              hideZeroHits
                ? "bg-rtfl-accent-bg border-rtfl-accent-line text-rtfl-accent-ink"
                : "bg-transparent border-rtfl-line text-rtfl-ink-2"
            )}
          >
            {hideZeroHits ? "showing hits" : "hide misses"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-[6px] content-start overflow-y-auto max-h-[300px] pr-[2px]">
        {filteredGuesses.map((g) => {
          const color = getWordColorDeterministic(g.word);
          const isSelected = g.id === selectedGuess?.id;

          return (
            <button
              key={g.id}
              type="button"
              className="inline-flex items-baseline gap-[5px] px-[9px] py-[4px] rounded-[7px] font-mono text-[12.5px] transition-[background,box-shadow] duration-150 cursor-pointer"
              style={{
                background: !g.valid
                  ? 'rgba(255,255,255,.028)'
                  : isSelected
                    ? `${color}2e`
                    : 'rgba(255,255,255,.045)',
                color: g.valid ? color : '#7a818d',
                textDecoration: g.valid ? 'none' : 'line-through',
                boxShadow: g.valid && isSelected ? `inset 0 0 0 1px ${color}80` : 'none',
              }}
              onClick={() => {
                if (g.valid) {
                  onGuessSelect(isSelected ? null : { id: g.id, word: g.word });
                  onWordHover(null);
                }
              }}
              onMouseEnter={() => {
                if (g.valid && !selectedGuess) onWordHover(g.word);
              }}
              onMouseLeave={() => {
                if (g.valid && !selectedGuess) onWordHover(null);
              }}
            >
              <span>{g.word}</span>
              {g.valid && g.hits > 0 && (
                <span style={{ opacity: 0.72 }} className="text-[10.5px]">×{g.hits}</span>
              )}
            </button>
          );
        })}
      </div>

      {guessHits.length === 0 && (
        <p className="font-sans text-[12px] leading-[1.6] text-rtfl-ink-3 m-0">
          Your guesses collect here. Hover one to light up every place it appears.
        </p>
      )}
    </div>
  );
};

export const GuessHistory = React.memo(GuessHistoryComponent);
