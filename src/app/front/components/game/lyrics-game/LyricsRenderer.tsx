import React from "react";
import { WordRenderer } from "./WordRenderer";
import { calculateWordState, splitIntoTokens, isWord, isWhitespace } from "@/app/front/lib/utils/word-processing";
import { getWordColor, Color } from "@/app/front/lib/utils/color-management";

interface LyricsRendererProps {
  lyrics: string;
  foundWords: string[];
  hoveredWord?: string | null;
  selectedWord?: string | null;
  guesses: Array<{ id: string; word: string; valid: boolean; }>;
  colors: Color[];
  isComplete?: boolean;
  showFullLyrics?: boolean;
}

export function LyricsRenderer({
  lyrics,
  foundWords,
  hoveredWord = null,
  selectedWord = null,
  guesses,
  colors,
  isComplete = false,
  showFullLyrics = false,
}: LyricsRendererProps) {
  const tokens = splitIntoTokens(lyrics);
  
  return (
    <div className="space-y-4">
      {tokens.map((token, index) => {
        if (isWhitespace(token)) {
          return <span key={index}>{token}</span>;
        }
        
        if (isWord(token)) {
          const state = calculateWordState(
            token,
            foundWords,
            hoveredWord,
            selectedWord,
            isComplete,
            showFullLyrics
          );
          
          const color = getWordColor(token, guesses, colors);
          
          return (
            <WordRenderer
              key={index}
              word={token}
              isFound={state.isFound}
              shouldShow={state.shouldShow}
              isNewlyFound={state.isNewlyFound}
              isHovered={state.isHovered}
              isSelected={state.isSelected}
              color={color}
            />
          );
        }
        
        return <span key={index}>{token}</span>;
      })}
    </div>
  );
} 