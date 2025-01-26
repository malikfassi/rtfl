import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/app/front/lib/utils";
import { Input } from "@/app/front/components/ui/Input";
import { GuessHistory } from "./GuessHistory";

interface Guess {
  id: string;
  gameId: string;
  playerId: string;
  word: string;
  createdAt: Date;
  valid: boolean;
}

interface GameControlsProps {
  playerId: string;
  date: string;
  isGameComplete: boolean;
  guesses: Guess[];
  maskedLyrics: string;
  onGuess: (guess: string) => Promise<void>;
  isSubmitting: boolean;
  onWordHover: (word: string | null) => void;
  selectedGuess: { id: string; word: string } | null;
  onGuessSelect: (guess: { id: string; word: string } | null) => void;
  className?: string;
  colors: Array<{ bg: string; text: string; }>;
}

export function GameControls({ 
  isGameComplete, 
  guesses,
  maskedLyrics, 
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

  // Count hits for each guess
  const guessHits = guesses.map(guess => {
    const hits = (maskedLyrics.match(new RegExp(guess.word, 'gi')) || []).length;
    return { ...guess, hits };
  });

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
              "w-full rounded-lg bg-primary-muted/5 px-4 py-2 text-primary-dark",
              "placeholder:text-primary-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-primary-muted/20",
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

      <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-4">
        <div className="flex gap-1.5 min-w-min">
          {[...guessHits].reverse().map((g, i) => {
            const index = guesses.findIndex(guess => guess.id === g.id);
            const color = colors[index % colors.length];
            const isSelected = g.id === selectedGuess?.id;
            
            return (
              <React.Fragment key={g.id}>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1 cursor-pointer transition-all duration-200",
                    g.valid 
                      ? cn(
                          "bg-primary-muted/10 text-primary-dark",
                          isSelected && "bg-primary-muted/20"
                        )
                      : "bg-accent-error/10 text-accent-error line-through opacity-50"
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
                  <span>{g.word}</span>
                  {g.valid && g.hits > 0 && (
                    <span className="text-[10px] font-medium text-accent-info">×{g.hits}</span>
                  )}
                </span>
                {i < guessHits.length - 1 && (
                  <span className="text-primary-muted/30">-</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block">
        <GuessHistory 
          guesses={guesses} 
          maskedLyrics={maskedLyrics} 
          onWordHover={onWordHover}
          selectedGuess={selectedGuess}
          onGuessSelect={onGuessSelect}
          colors={colors}
        />
      </div>
    </div>
  );
} 