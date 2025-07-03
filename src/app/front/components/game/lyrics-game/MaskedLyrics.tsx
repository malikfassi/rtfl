"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";
import { LyricsRenderer } from "./LyricsRenderer";
import { WordRenderer } from "./WordRenderer";
import { useWordHighlighting } from "@/app/front/hooks/useWordHighlighting";
import { calculateWordState, getWordColor } from "@/app/front/lib/utils/word-processing";
import type { MaskedLyricsProps } from "@/app/types";

export function MaskedLyrics({ 
  title, 
  artist, 
  lyrics, 
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  isComplete = false,
  foundWords,
  guesses,
  colors,
  song,
  isAdmin = false,
  showFullLyrics: externalShowFullLyrics
}: MaskedLyricsProps) {
  const [internalShowFullLyrics, setInternalShowFullLyrics] = useState(false);
  const { hoveredWord, selectedWord, handleWordHover, handleWordSelect } = useWordHighlighting();
  
  // Use external control if provided, otherwise use internal state
  const showFullLyrics = externalShowFullLyrics !== undefined ? externalShowFullLyrics : internalShowFullLyrics;

  const safeTitle = typeof title === 'string' ? title : '';
  const safeArtist = typeof artist === 'string' ? artist : '';
  const safeLyrics = typeof lyrics === 'string' ? lyrics : '';

  const renderTitleAndArtist = () => {
    const titleParts = maskedTitleParts || safeTitle.split(' ').map(word => ({ value: word, isToGuess: true }));
    const artistParts = maskedArtistParts || safeArtist.split(' ').map(word => ({ value: word, isToGuess: true }));
    
    return (
      <div className="text-xl sm:text-2xl font-bold tracking-wide mb-8">
        <div className="mb-2">
          <div>
            {titleParts.map((part, i) => {
              const wordState = calculateWordState(
                part.value,
                foundWords,
                hoveredWord,
                selectedWord,
                isComplete,
                showFullLyrics
              );
              const color = getWordColor(part.value, guesses, colors);
              
              return (
                <React.Fragment key={`title-${i}`}>
                  {part.isToGuess ? (
                    <span
                      onMouseEnter={() => handleWordHover(part.value)}
                      onMouseLeave={() => handleWordHover(null)}
                      onClick={() => handleWordSelect(part.value)}
                    >
                      <WordRenderer
                        word={part.value}
                        {...wordState}
                        color={color}
                      />
                    </span>
                  ) : (
                    <span>{part.value}</span>
                  )}
                  {i < titleParts.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-primary-muted font-normal">by</span>
          {artistParts.map((part, i) => {
            const wordState = calculateWordState(
              part.value,
              foundWords,
              hoveredWord,
              selectedWord,
              isComplete,
              showFullLyrics
            );
            const color = getWordColor(part.value, guesses, colors);
            
            return (
              <React.Fragment key={`artist-${i}`}>
                {part.isToGuess ? (
                  <span
                    onMouseEnter={() => handleWordHover(part.value)}
                    onMouseLeave={() => handleWordHover(null)}
                    onClick={() => handleWordSelect(part.value)}
                  >
                    <WordRenderer
                      word={part.value}
                      {...wordState}
                      color={color}
                    />
                  </span>
                ) : (
                  <span>{part.value}</span>
                )}
                {i < artistParts.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div data-testid="masked-lyrics" className="space-y-6 pl-4 sm:pl-8">
      {renderTitleAndArtist()}

      {isAdmin && song && (
        <div className="flex justify-center">
          <button
            onClick={() => setInternalShowFullLyrics(prev => !prev)}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors text-sm",
              "bg-primary-muted/5 hover:bg-primary-muted/10",
              "text-primary-muted hover:text-primary-dark"
            )}
          >
            {showFullLyrics ? "Hide" : "Reveal"} Full Lyrics
          </button>
        </div>
      )}

      <LyricsRenderer
        lyrics={isAdmin && showFullLyrics && song?.lyrics ? song.lyrics : (maskedLyricsParts || safeLyrics)}
        foundWords={foundWords}
        hoveredWord={hoveredWord}
        selectedWord={selectedWord}
        guesses={guesses}
        isComplete={isComplete}
        showFullLyrics={showFullLyrics}
        colors={colors}
      />
    </div>
  );
}