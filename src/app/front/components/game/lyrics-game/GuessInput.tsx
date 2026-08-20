"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import { cn } from '@/app/front/lib/utils';
import type { GuessInputProps } from './types';

type FeedbackResult =
  | { kind: 'hit'; hits: number }
  | { kind: 'duplicate' }
  | { kind: 'miss' };

export const GuessInput = ({ onGuessSubmit, pendingGuess, disabled, placeholder = 'Type your guess...', inlineFeedback = false, onDuplicateGuess }: GuessInputProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [resultId, setResultId] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedWordRef = useRef<string | null>(null);

  const setLastResult = (r: FeedbackResult) => {
    setResult(r);
    setResultId(id => id + 1);
  };

  // Focus on mount, and again whenever the input transitions from disabled to enabled.
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  useEffect(() => {
    if (!disabled && inputRef.current) inputRef.current.focus();
  }, [disabled]);

  const refocusAndSelect = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const guess = input.trim().toLowerCase();
    if (!guess || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const hits = await onGuessSubmit(guess);
      setInput(guess);
      lastSubmittedWordRef.current = guess;
      setLastResult(hits > 0 ? { kind: 'hit', hits } : { kind: 'miss' });
      refocusAndSelect();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('already submitted this word')) {
        setLastResult({ kind: 'duplicate' });
        onDuplicateGuess?.(guess);
        setInput(guess);
        refocusAndSelect();
      } else {
        console.error('Guess failed:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && lastSubmittedWordRef.current) {
      e.preventDefault();
      setInput(lastSubmittedWordRef.current);
    }
  };

  const resultColor = result?.kind === 'hit'
    ? 'text-rtfl-hit'
    : result?.kind === 'duplicate'
      ? 'text-rtfl-duplicate'
      : 'text-rtfl-ink-2';

  const resultLabel = result?.kind === 'hit'
    ? `+${result.hits}`
    : result?.kind === 'duplicate'
      ? 'already guessed'
      : result?.kind === 'miss'
        ? 'no match'
        : null;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center gap-[10px] bg-rtfl-bg border rounded-[10px] px-[14px] transition-colors duration-150",
            isFocused ? "border-rtfl-accent-line" : "border-rtfl-line"
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            aria-label="Type your guess"
            data-testid="guess-input"
            disabled={disabled || isSubmitting}
            className="flex-1 min-w-0 bg-transparent border-none outline-none font-mono text-[15px] max-sm:text-[16px] text-rtfl-ink py-[13px] max-sm:py-[14px] placeholder:text-rtfl-ink-3"
          />
          {inlineFeedback && result ? (
            // Mobile has no room for a reserved row under the input, so the
            // result sits at the field's right edge instead.
            <span key={resultId} className={cn("text-[13px] font-medium whitespace-nowrap animate-rtfl-count", resultColor)}>
              {resultLabel}
            </span>
          ) : (
            <span
              className="font-sans text-[10px] text-rtfl-ink-3 transition-opacity duration-150"
              style={{ opacity: input.trim() ? 1 : 0 }}
            >
              enter ⏎
            </span>
          )}
        </div>
      </form>

      <div className={cn("h-5 flex items-center gap-2", inlineFeedback && "hidden")}>
        {result && (
          <span key={resultId} className="contents">
            <span className={cn("text-[13px] font-medium animate-rtfl-count", resultColor)}>
              {resultLabel}
            </span>
            {result.kind === 'hit' && (
              <span className="font-sans text-[11px] text-rtfl-ink-2 animate-rtfl-count">
                {result.hits} word{result.hits === 1 ? '' : 's'} revealed
              </span>
            )}
          </span>
        )}
        {pendingGuess && !result && (
          <span className="font-sans text-[11px] text-rtfl-ink-3">checking &ldquo;{pendingGuess}&rdquo;…</span>
        )}
      </div>
    </div>
  );
};
