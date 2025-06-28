import React from "react";
import { WordRenderer } from "./WordRenderer";
import { calculateWordState, splitIntoTokens, isWord, isWhitespace } from "@/app/front/lib/utils/word-processing";
import { getWordColor } from "@/app/front/lib/utils/color-management";
import type { LyricsRendererProps } from "@/app/types";

export function LyricsRenderer({
  lyrics,
  foundWords,
  hoveredWord = null,
  selectedWord = null,
  guesses,
  isComplete = false,
  showFullLyrics = false,
}: LyricsRendererProps) {
  // Handle both string and token array inputs
  const tokens = Array.isArray(lyrics) 
    ? lyrics 
    : splitIntoTokens(lyrics);
  
  return (
    <div className="space-y-4">
      {tokens.map((token, index) => {
        const tokenValue = typeof token === 'string' ? token : token.value;
        
        if (isWhitespace(tokenValue)) {
          // Preserve newlines by rendering them as line breaks
          if (tokenValue.includes('\n')) {
            return <br key={index} />;
          }
          return <span key={index}>{tokenValue}</span>;
        }
        
        if (isWord(tokenValue)) {
          const state = calculateWordState(
            tokenValue,
            foundWords,
            hoveredWord,
            selectedWord,
            isComplete,
            showFullLyrics
          );
          
          const color = getWordColor(tokenValue, guesses);
          
          return (
            <WordRenderer
              key={index}
              word={tokenValue}
              isFound={state.isFound}
              shouldShow={state.shouldShow}
              isNewlyFound={state.isNewlyFound}
              isHovered={state.isHovered}
              isSelected={state.isSelected}
              color={color}
            />
          );
        }
        
        return <span key={index}>{tokenValue}</span>;
      })}
    </div>
  );
} 