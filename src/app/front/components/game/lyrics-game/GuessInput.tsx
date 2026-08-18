"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/app/front/lib/utils';
import type { GuessInputProps } from './types';

export const GuessInput = ({ onGuessSubmit, pendingGuess, disabled, onDuplicateGuess }: GuessInputProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guessState, setGuessState] = useState<'initial' | 'duplicate' | 'success' | 'error'>('initial');
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount and when disabled state changes
  useEffect(() => {
    // Focus when component mounts (regardless of disabled state)
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []); // Empty dependency array - only run on mount
  
  // Focus when disabled state changes from true to false (game loads)
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const guess = input.trim().toLowerCase();
    
    if (!guess || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    // Don't reset guessState here - keep the previous state until we know the result
    
    try {
      const hits = await onGuessSubmit(guess);
      setInput(guess);
      if (hits > 0) {
        setGuessState('success');
        setBubbleText(`+${hits}`);
        setBubblePosition({ x: Math.random() * 100 + 25, y: -20 });
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 4000);
      } else {
        setGuessState('error');
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    } catch (error: any) {
      // Check if it's a duplicate guess error
      if (error?.message?.includes('already submitted this word')) {
        setErrorMessage('You already guessed that word!');
        setGuessState('duplicate');
        // Auto-click the existing guess if callback provided
        if (onDuplicateGuess) {
          onDuplicateGuess(guess);
        }
        // Keep the word in input but select it
        setInput(guess);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 100);
        // Clear error message after a delay but keep the color
        setTimeout(() => {
          setErrorMessage(null);
        }, 3000);
      } else {
        // Other errors - show generic message
        setErrorMessage('Failed to submit guess. Please try again.');
        setGuessState('error');
        console.error('Guess failed:', error);
        // Keep the word in input but select it
        setInput(guess);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 100);
        // Clear error message after a delay but keep the color
        setTimeout(() => {
          setErrorMessage(null);
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get the appropriate styling based on guess state. Built on the theme's
  // card/accent tokens (not literal hex) so it adapts to dark mode instead
  // of staying a bright light-mode-only box.
  const getInputStyling = () => {
    const baseClasses = "w-full px-4 py-3 border-0 rounded-xl bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all duration-200 text-base";

    switch (guessState) {
      case 'duplicate':
        return cn(baseClasses, "ring-2 ring-accent-warning/40 focus:ring-accent-warning/60");
      case 'success':
        return cn(baseClasses, "ring-2 ring-accent-success/40 focus:ring-accent-success/60");
      case 'error':
        return cn(baseClasses, "ring-2 ring-accent-error/40 focus:ring-accent-error/60");
      default:
        return cn(baseClasses, "ring-1 ring-primary/20 focus:ring-primary/40");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your guess..."
          aria-label="Type your guess"
          data-testid="guess-input"
          disabled={isSubmitting}
          className={cn(
            getInputStyling(),
            "shadow-sm",
            pendingGuess && 'pending',
            disabled && 'disabled',
            input.trim() && 'has-content'
          )}
        />
        <div className="enter-hint">
          <span className="key">↵</span>
          <span className="text">Enter</span>
        </div>
      </div>
      
      {/* Bubble Animation */}
      {showBubble && (
        <div 
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${bubblePosition.x}px`,
            top: `${bubblePosition.y}px`,
            animation: 'bubbleFloat 4s ease-out forwards'
          }}
        >
          <div className="bg-accent-success text-white px-2 py-1 rounded-full text-sm font-bold shadow-lg">
            {bubbleText}
          </div>
        </div>
      )}
      
      {pendingGuess && (
        <div className="pending-feedback">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          Checking &ldquo;{pendingGuess}&rdquo;...
        </div>
      )}

      {errorMessage && (
        <div className="error-feedback">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes bubbleFloat {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateY(-20px) scale(1.1);
          }
          85% {
            opacity: 1;
            transform: translateY(-40px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.8);
          }
        }
      `}</style>
    </form>
  );
};
