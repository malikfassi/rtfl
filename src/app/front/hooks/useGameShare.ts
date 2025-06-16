import { useRef, useEffect } from 'react';

interface GameShareProps {
  isGameComplete: boolean;
  lyricsPercent: number;
  titlePercent: number;
  artistPercent: number;
  guessCount: number;
  date: string;
}

interface GameShareState {
  shareText: string;
  gameUrl: string;
  handleShare: () => Promise<void>;
}

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
  const handleShare = async () => {
    try {
      const fullText = `${shareText}\n\n${gameUrl}`;
      await navigator.clipboard.writeText(fullText);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // You might want to show a toast notification here
    }
  };

  // Handle game completion
  useEffect(() => {
    if (isGameComplete && !hasSharedRef.current) {
      hasSharedRef.current = true;
      handleShare();
    }
    if (!isGameComplete) {
      hasSharedRef.current = false;
    }
  }, [isGameComplete]);

  return {
    shareText,
    gameUrl,
    handleShare,
  };
} 