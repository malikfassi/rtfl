"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";

interface MaskedLyricsProps {
  title: string;
  artist: string;
  lyrics: string;
  isComplete?: boolean;
  foundWords: string[];
  hoveredWord?: string | null;
  selectedWord?: string | null;
  guesses: Array<{
    id: string;
    word: string;
    valid: boolean;
  }>;
  colors: Array<{ bg: string; text: string; }>;
  song?: { lyrics: string; } | null;
}

export function MaskedLyrics({ 
  title, 
  artist, 
  lyrics, 
  isComplete = false,
  foundWords,
  hoveredWord = null,
  selectedWord = null,
  guesses,
  colors,
  song
}: MaskedLyricsProps) {
  const [showFullLyrics, setShowFullLyrics] = useState(false);

  const getWordColor = (word: string) => {
    const index = guesses.findIndex(g => g.valid && g.word.toLowerCase() === word.toLowerCase());
    if (index === -1) return undefined;
    return colors[index % colors.length].text;
  };

  const renderWord = (word: string, isFound: boolean, shouldShow: boolean, isNewlyFound: boolean, isHovered: boolean, isSelected: boolean) => {
    const color = getWordColor(word);
    
    return (
      <span
        className={cn(
          "transition-all duration-500",
          shouldShow
            ? isFound
              ? cn(
                  "text-primary-dark hover:scale-110",
                  isNewlyFound && "animate-[fadeInDown_1s_ease-out]",
                  (isHovered || isSelected) && cn(
                    "scale-110",
                    color ? `bg-${color.replace('text-', '')}/10 ${color}` : "bg-accent-info/10 text-accent-info"
                  )
                )
              : "text-primary-dark/90 animate-[fadeIn_1.5s_ease-in-out]"
            : "text-primary-dark/0",
          "inline-block relative"
        )}
      >
        {word}
        {!shouldShow && (
          <span 
            className={cn(
              "absolute inset-0 text-primary-muted/30",
              "transition-opacity duration-300"
            )}
          >
            {'_'.repeat(word.length)}
          </span>
        )}
      </span>
    );
  };

  const renderTitleAndArtist = () => {
    const titleWords = title.split(' ');
    const artistWords = artist.split(' ');

    return (
      <div className="text-xl sm:text-2xl font-bold tracking-wide mb-8">
        <div className="mb-2">
          <div>
            {titleWords.map((word, i) => {
              const isFound = foundWords.includes(word.toLowerCase());
              const shouldShow = isFound || (isComplete && showFullLyrics);
              const isNewlyFound = isFound && foundWords[foundWords.length - 1] === word.toLowerCase();
              const isHovered = Boolean(hoveredWord && word.toLowerCase() === hoveredWord.toLowerCase());
              const isSelected = Boolean(selectedWord && word.toLowerCase() === selectedWord.toLowerCase());
              
              return (
                <React.Fragment key={`title-${i}`}>
                  {renderWord(word, isFound, shouldShow, isNewlyFound, isHovered, isSelected)}
                  {i < titleWords.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-primary-muted font-normal">by</span>
          {artistWords.map((word, i) => {
            const isFound = foundWords.includes(word.toLowerCase());
            const shouldShow = isFound || (isComplete && showFullLyrics);
            const isNewlyFound = isFound && foundWords[foundWords.length - 1] === word.toLowerCase();
            const isHovered = Boolean(hoveredWord && word.toLowerCase() === hoveredWord.toLowerCase());
            const isSelected = Boolean(selectedWord && word.toLowerCase() === selectedWord.toLowerCase());
            
            return (
              <React.Fragment key={`artist-${i}`}>
                {renderWord(word, isFound, shouldShow, isNewlyFound, isHovered, isSelected)}
                {i < artistWords.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLyrics = () => {
    return lyrics.split("\n").map((line, lineIndex) => (
      <div key={`line-${lineIndex}`} className="mb-2">
        {line.match(/(\p{L}+|\p{N}+|\s+|[^\p{L}\p{N}\s]+)/gu)?.map((part, partIndex) => {
          if (/^\s+$/.test(part)) {
            return <span key={`${lineIndex}-${partIndex}-space`}>{part}</span>;
          }
          
          const isWord = /^(\p{L}+|\p{N}+)$/u.test(part);
          if (!isWord) {
            return <span key={`${lineIndex}-${partIndex}-punct`}>{part}</span>;
          }

          const isFound = foundWords.includes(part.toLowerCase());
          const shouldShow = isFound || (isComplete && showFullLyrics);
          const isNewlyFound = isFound && foundWords[foundWords.length - 1] === part.toLowerCase();
          const isHovered = Boolean(hoveredWord && part.toLowerCase() === hoveredWord.toLowerCase());
          const isSelected = Boolean(selectedWord && part.toLowerCase() === selectedWord.toLowerCase());
          
          return (
            <React.Fragment key={`${lineIndex}-${partIndex}-word`}>
              {renderWord(part, isFound, shouldShow, isNewlyFound, isHovered, isSelected)}
            </React.Fragment>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="space-y-6 pl-4 sm:pl-8">
      {renderTitleAndArtist()}

      {song && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowFullLyrics(prev => !prev)}
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

      <div className="font-mono text-sm leading-relaxed">
        {renderLyrics()}
      </div>
    </div>
  );
}