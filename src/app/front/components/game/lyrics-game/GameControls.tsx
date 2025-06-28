import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/app/front/lib/utils";
import { GuessHistory } from "./GuessHistory";
import type { GameControlsProps } from "@/app/types";


export function GameControls({ 
  isGameComplete, 
  guesses,
  maskedLyrics,
  maskedTitle,
  maskedArtist,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  onGuess, 
  isSubmitting,
  onWordHover,
  selectedGuess,
  onGuessSelect,
  className,
  colors
}: GameControlsProps) {
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    const focusInput = () => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    };

    // Focus on mount
    focusInput();

    // Focus when window regains focus
    window.addEventListener('focus', focusInput);

    return () => {
      window.removeEventListener('focus', focusInput);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;

    try {
      await onGuess(guess.trim());
      setGuess("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess");
    }
    
    // Keep focus on input after submission
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess..."
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-lg bg-primary-muted/5 px-4 py-2 text-primary-dark border-none focus:border-none focus:ring-2 focus:ring-primary-muted/20",
              "placeholder:text-primary-muted/50",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>
        {error && (
          <div className="text-xs text-accent-error">{error}</div>
        )}
      </form>

      {isGameComplete && (
        <div className="text-center p-4 my-4 bg-accent-success/10 text-accent-success rounded-md font-medium text-sm">
          You&apos;ve completed today&apos;s game! Keep guessing to find more words.
        </div>
      )}

      {/* Always use GuessHistory for guesses display, no mobile/desktop split */}
      <GuessHistory 
        guesses={guesses} 
        maskedLyrics={maskedLyrics}
        maskedTitle={maskedTitle}
        maskedArtist={maskedArtist}
        maskedTitleParts={maskedTitleParts}
        maskedArtistParts={maskedArtistParts}
        maskedLyricsParts={maskedLyricsParts}
        onWordHover={onWordHover}
        selectedGuess={selectedGuess}
        onGuessSelect={onGuessSelect}
        colors={colors}
      />
    </div>
  );
} 