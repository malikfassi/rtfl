import { useRef, useEffect, useCallback } from 'react';
import type { GameShareProps, GameShareState } from '@/app/types';

export function useGameShare({
  isGameComplete,
  lyricsPercent,
  titlePercent,
  artistPercent,
  guessCount,
  date,
}: GameShareProps): GameShareState {
  const hasSharedRef = useRef(false);

  // Calculate share text and URL
  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${date}` : '';
  
  const shareText = isGameComplete
    ? `🎯  Just played RTFL - Read the F***ing Lyrics!\n\n${
        [
          `🎵 Lyrics: ${lyricsPercent}%`,
          `📝 Title: ${titlePercent}%`,
          `👤 Artist: ${artistPercent}%`,
          `💭 Guesses: ${guessCount}`
        ].join('\n')
      }\n\nThink you can do better? 🎯`
    : `I'm trying to solve today's RTFL lyrics challenge! Can you help me?\n\nPlay here:`;

  // Handle share functionality
  const handleShare = useCallback(async () => {
    try {
      const fullText = `${shareText}\n\n${gameUrl}`;
      await navigator.clipboard.writeText(fullText);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // You might want to show a toast notification here
    }
  }, [shareText, gameUrl]);

  // Handle game completion
  useEffect(() => {
    if (isGameComplete && !hasSharedRef.current) {
      hasSharedRef.current = true;
      handleShare();
    }
    if (!isGameComplete) {
      hasSharedRef.current = false;
    }
  }, [isGameComplete, handleShare]);

  return {
    shareText,
    gameUrl,
    handleShare,
  };
} 