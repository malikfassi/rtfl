// Word highlighting hook types
export interface UseWordHighlightingProps {
  foundWords: string[];
  hoveredWord: string | null;
  selectedWord: string | null;
}

// Rickroll game types
export interface RickrollGame {
  isActive: boolean;
  startTime: number;
  duration: number;
}

 