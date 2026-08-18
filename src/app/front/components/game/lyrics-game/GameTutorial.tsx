"use client";

import React, { useState } from 'react';
import type { GameTutorialProps } from './types';

export const GameTutorial = ({ isOpen, onClose, onDontShowAgain }: GameTutorialProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header with close button and don't show again */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome to Lyrics Game!
          </h2>
          <div className="flex items-center gap-4">
            {/* Don't show again checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dont-show-again"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="dont-show-again" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Don't show again
              </label>
            </div>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* How to Play */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">How to Play</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-foreground font-medium">Guess Words</p>
                  <p className="text-muted-foreground text-sm">
                    Type words you think appear in the song&apos;s lyrics, title, or artist name.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-foreground font-medium">Reveal Lyrics</p>
                  <p className="text-muted-foreground text-sm">
                    Correct guesses reveal those words in the masked lyrics display.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-foreground font-medium">Find All Words</p>
                  <p className="text-muted-foreground text-sm">
                    Keep guessing until you&apos;ve found most of the important words in the song.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Tips</h3>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-accent-success text-lg">💡</span>
                <p className="text-sm text-foreground">
                  Start with common words like "love", "you", "the", "and"
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent-success text-lg">💡</span>
                <p className="text-sm text-foreground">
                  Try the artist's name and song title words
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent-success text-lg">💡</span>
                <p className="text-sm text-foreground">
                  Hover over guesses to highlight matching words
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent-success text-lg">💡</span>
                <p className="text-sm text-foreground">
                  Click on a guess to scroll to and highlight all instances
                </p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Example</h3>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Masked lyrics:</p>
                <p className="font-mono text-sm text-foreground">
                  &quot;I ___ you ___ much, I ___ you ___ much&quot;
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">After guessing "love":</p>
                <p className="font-mono text-sm text-foreground">
                  "I <span className="text-accent-success font-bold">love</span> you ___ much, I <span className="text-accent-success font-bold">love</span> you ___ much"
                </p>
              </div>
            </div>
          </div>

          {/* Get Started button */}
          <button
            onClick={handleClose}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium transition-colors text-lg"
          >
            Get Started!
          </button>
        </div>
      </div>
    </div>
  );
}; 