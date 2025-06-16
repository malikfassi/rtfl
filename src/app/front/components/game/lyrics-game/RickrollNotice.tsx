import React, { useState, useEffect } from 'react';
import { cn } from "@/app/front/lib/utils";

interface RickrollNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  isFutureDate: boolean;
  date: string;
}

export function RickrollNotice({ isOpen, onClose, isFutureDate, date }: RickrollNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const daysUntilGame = Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rickroll-notice-title"
    >
      <div 
        className={cn(
          "bg-background rounded-lg p-6 max-w-sm mx-4 space-y-4 border border-primary-muted/20 transform transition-transform duration-300",
          isOpen ? "scale-100" : "scale-95"
        )}
      >
        <h2 
          id="rickroll-notice-title" 
          className="text-lg font-bold text-primary-dark mb-2 text-center"
        >
          {isFutureDate ? 'Nice try, time traveler! 🚀' : 'No game available'}
        </h2>
        <p className="text-sm text-primary-dark mb-4 text-center">
          {isFutureDate 
            ? `You'll have to wait ${daysUntilGame} days to play this game! Until then, enjoy this special hidden song... 🎵`
            : "We couldn't find a daily game for this date, but you can still play! Try to guess this classic hit instead. 🎶"
          }
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info rounded-lg transition-colors font-medium"
          aria-label="Start playing"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🎮</span>
            <span>Let's play</span>
          </span>
        </button>
      </div>
    </div>
  );
} 