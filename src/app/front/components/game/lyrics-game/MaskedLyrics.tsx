"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";

interface MaskedLyricsProps {
  title: string;
  artist: string;
  lyrics: string;
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
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
  isAdmin?: boolean;
  showFullLyrics?: boolean;
}

export function MaskedLyrics({ 
  title, 
  artist, 
  lyrics, 
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  isComplete = false,
  foundWords,
  hoveredWord = null,
  selectedWord = null,
  guesses,
  colors,
  song,
  isAdmin = false,
  showFullLyrics: externalShowFullLyrics
}: MaskedLyricsProps) {
  const [internalShowFullLyrics, setInternalShowFullLyrics] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const showFullLyrics = externalShowFullLyrics !== undefined ? externalShowFullLyrics : internalShowFullLyrics;

  const safeTitle = typeof title === 'string' ? title : '';
  const safeArtist = typeof artist === 'string' ? artist : '';
  const safeLyrics = typeof lyrics === 'string' ? lyrics : '';

  const getWordColor = (word: string) => {
    const index = guesses.findIndex(g => g.valid && g.word.toLowerCase() === word.toLowerCase());
    if (index === -1) return undefined;
    return colors[index % colors.length];
  };

  const renderWord = (word: string, isFound: boolean, shouldShow: boolean, isNewlyFound: boolean, isHovered: boolean, isSelected: boolean) => {
    const color = getWordColor(word);
    
    return (
      <span
        className={cn(
          "relative font-mono text-sm align-baseline",
          shouldShow
            ? isFound
              ? cn(
                  "text-primary-dark",
                  isNewlyFound && "animate-word-reveal",
                  ((showFullLyrics && isComplete) || isHovered || isSelected)
                    ? cn(color && `${color.bg} ${color.text}`, (isHovered || isSelected) && "transition-colors duration-300 scale-105")
                    : undefined
                )
              : "text-primary-dark/90 animate-word-reveal"
            : cn(
                "text-primary-dark/0",
                !showFullLyrics && "relative"
              ),
          "inline-block min-w-[1ch] text-center transition-none"
        )}
        style={{ fontWeight: 'inherit', fontSize: 'inherit', padding: 0 }}
      >
        {shouldShow ? word : (
          <>
            <span className="opacity-0 select-none">{word}</span>
            {!showFullLyrics && (
              <span 
                className={cn(
                  "absolute inset-0 text-primary-muted/30 flex items-center justify-center select-none",
                  "transition-none"
                )}
                style={{ fontWeight: 'inherit', fontSize: 'inherit', padding: 0 }}
              >
                {'_'.repeat(word.length)}
              </span>
            )}
          </>
        )}
      </span>
    );
  };

  const renderTitleAndArtist = () => {
    const titleParts = maskedTitleParts || safeTitle.split(' ').map(word => ({ value: word, isToGuess: true }));
    const artistParts = maskedArtistParts || safeArtist.split(' ').map(word => ({ value: word, isToGuess: true }));
    return (
      <div className="text-xl sm:text-2xl font-bold tracking-wide mb-8">
        <div className="mb-2">
          <div>
            {titleParts.map((part, i) => {
              const isFound = foundWords.includes(part.value.toLowerCase());
              const shouldShow = !part.isToGuess || isFound || (isComplete && showFullLyrics);
              const isNewlyFound = isFound && foundWords[foundWords.length - 1] === part.value.toLowerCase();
              const isHovered = Boolean(hoveredWord && part.value.toLowerCase() === hoveredWord.toLowerCase());
              const isSelected = Boolean(selectedWord && part.value.toLowerCase() === selectedWord.toLowerCase());
              return (
                <React.Fragment key={`title-${i}`}>
                  {part.isToGuess
                    ? renderWord(part.value, isFound, shouldShow, isNewlyFound, isHovered, isSelected)
                    : <span>{part.value}</span>}
                  {i < titleParts.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-primary-muted font-normal">by</span>
          {artistParts.map((part, i) => {
            const isFound = foundWords.includes(part.value.toLowerCase());
            const shouldShow = !part.isToGuess || isFound || (isComplete && showFullLyrics);
            const isNewlyFound = isFound && foundWords[foundWords.length - 1] === part.value.toLowerCase();
            const isHovered = Boolean(hoveredWord && part.value.toLowerCase() === hoveredWord.toLowerCase());
            const isSelected = Boolean(selectedWord && part.value.toLowerCase() === selectedWord.toLowerCase());
            return (
              <React.Fragment key={`artist-${i}`}>
                {part.isToGuess
                  ? renderWord(part.value, isFound, shouldShow, isNewlyFound, isHovered, isSelected)
                  : <span>{part.value}</span>}
                {i < artistParts.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLyrics = () => {
    if (maskedLyricsParts) {
      // Split tokens into lines by splitting at tokens containing '\n'
      const lines: Array<Array<{ value: string; isToGuess: boolean }>> = [];
      let currentLine: Array<{ value: string; isToGuess: boolean }> = [];
      maskedLyricsParts.forEach((token) => {
        const parts = token.value.split('\n');
        parts.forEach((part, idx) => {
          if (part.length > 0) {
            currentLine.push({ value: part, isToGuess: token.isToGuess });
          }
          if (idx < parts.length - 1) {
            lines.push(currentLine);
            currentLine = [];
          }
        });
      });
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      return (
        <>
          {lines.map((lineTokens, lineIdx) => (
            <div key={lineIdx} className="mb-2">
              {lineTokens.map((part, i) => {
                if (!part.isToGuess) {
                  return <span key={i}>{part.value}</span>;
                }
                const isFound = foundWords.includes(part.value.toLowerCase());
                const shouldShow = isFound || (isComplete && showFullLyrics);
                const isNewlyFound = isFound && foundWords[foundWords.length - 1] === part.value.toLowerCase();
                const isHovered = Boolean(hoveredWord && part.value.toLowerCase() === hoveredWord.toLowerCase());
                const isSelected = Boolean(selectedWord && part.value.toLowerCase() === selectedWord.toLowerCase());
                return (
                  <React.Fragment key={i}>
                    {renderWord(part.value, isFound, shouldShow, isNewlyFound, isHovered, isSelected)}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </>
      );
    }
    return safeLyrics.split("\n").map((line, lineIndex) => (
      <div key={`line-${lineIndex}`} className="mb-2">
        {line.match(/(\p{L}+|\p{N}+|\s+|[^\p{L}\p{N}\s]+)/gu)?.map((part, partIndex) => {
          if (/^\s+$/.test(part)) {
            return <span key={`${lineIndex}-${partIndex}-space`}>{part}</span>;
          }
          const isWord = new RegExp('^(\\p{L}+|\\p{N}+)$', 'u').test(part);
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

      <div className="font-mono text-sm leading-relaxed">
        {isAdmin && showFullLyrics && song?.lyrics
          ? song.lyrics.split("\n").map((line, i) => (
              <div key={i} className="mb-2">
                {line.split(/(\s+)/).map((part, j) => {
                  if (/^\s+$/.test(part)) {
                    return <span key={j}>{part}</span>;
                  }
                  const isFound = foundWords.includes(part.toLowerCase());
                  const color = getWordColor(part);
                  return (
                    <span
                      key={j}
                      className={cn(
                        "inline-block",
                        isFound && color && `${color.bg} ${color.text} px-1 rounded-sm`
                      )}
                    >
                      {part}
                    </span>
                  );
                })}
              </div>
            ))
          : renderLyrics()}
      </div>
    </div>
  );
}