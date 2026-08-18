"use client";

import React from 'react';
import { cn } from '@/app/front/lib/utils';
import type { WinPopupProps } from './types';

export const WinPopup = ({ 
  isOpen, 
  onClose, 
  gameStats, 
  onShare, 
  onShowFullLyrics,
  showFullLyrics 
}: WinPopupProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Celebration Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent-success/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Congratulations!
            </h2>
            <p className="text-muted-foreground">
              You&apos;ve completed today&apos;s lyrics game!
            </p>
          </div>

          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Final Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Guesses</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {gameStats.totalGuesses}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Correct Guesses</div>
                <div className="font-mono text-lg font-bold text-accent-success">
                  {gameStats.correctGuesses}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Accuracy</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {gameStats.accuracy}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Words Found</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {gameStats.wordsFound}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onShare}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Share Results
            </button>
            
            <button
              onClick={onShowFullLyrics}
              className={cn(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                showFullLyrics
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
              disabled={showFullLyrics}
            >
              {showFullLyrics ? 'Full Lyrics Shown' : 'Show Full Lyrics'}
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  );
}; 