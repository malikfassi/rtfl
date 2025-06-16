import { useState, useCallback } from 'react';

interface UseWordHighlightingProps {
  onWordHover?: (word: string | null) => void;
  onWordSelect?: (word: string | null) => void;
}

export function useWordHighlighting({ onWordHover, onWordSelect }: UseWordHighlightingProps = {}) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleWordHover = useCallback((word: string | null) => {
    setHoveredWord(word);
    onWordHover?.(word);
  }, [onWordHover]);

  const handleWordSelect = useCallback((word: string | null) => {
    setSelectedWord(word);
    onWordSelect?.(word);
  }, [onWordSelect]);

  const clearHighlighting = useCallback(() => {
    setHoveredWord(null);
    setSelectedWord(null);
  }, []);

  return {
    hoveredWord,
    selectedWord,
    handleWordHover,
    handleWordSelect,
    clearHighlighting
  };
} 