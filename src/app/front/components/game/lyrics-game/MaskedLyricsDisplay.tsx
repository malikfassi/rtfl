"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/app/front/lib/utils";
import { getWordColorDeterministic } from "@/app/front/lib/utils/color-management";
import { splitIntoTokens, isWord, isWhitespace } from "@/app/front/lib/utils/word-processing";

interface MaskedLyricsDisplayProps {
  title?: string;
  artist?: string;
  lyrics?: string;
  maskedTitleParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedArtistParts?: Array<{ value: string; isToGuess: boolean }>;
  maskedLyricsParts?: Array<{ value: string; isToGuess: boolean }>;
  highlightedWord?: string | null;
  scrollToWord?: string | null;
  showFullLyrics?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  guesses: Array<{ word: string; valid: boolean }>;
  clickedGuess?: { word: string } | null;
}

// WordRenderer component with improved pastel styling
const WordRenderer = React.forwardRef<HTMLSpanElement, {
  word: string;
  isHighlighted: boolean;
  color?: { bg: string; text: string };
  isRevealed?: boolean;
  isGuessed?: boolean;
}>(({
  word,
  isHighlighted,
  color,
  isRevealed = false,
  isGuessed = false
}, ref) => {
  // Check if this is an underscore word (masked word)
  const isUnderscoreWord = /^_+$/.test(word);
  
  if (isUnderscoreWord) {
    // Render each underscore as a separate span for perfect visual separation
    return (
      <span className="relative align-baseline font-sans" ref={ref}>
        {word.split('').map((char, idx) => (
          <span
            key={idx}
            className={cn(
              "inline-block masked-lyric-word text-base text-muted-foreground/80",
              isHighlighted && cn(
                "transition-all duration-200",
                color ? `${color.bg} ${color.text}` : "bg-primary-muted/20"
              )
            )}
            style={{ 
              fontWeight: 'inherit', 
              fontSize: 'inherit', 
              padding: 0,
              fontFamily: 'inherit',
              letterSpacing: 'inherit'
            }}
          >
            _
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={cn(
        "relative text-base align-baseline",
        "inline-block transition-none tracking-wide font-sans",
        // Different styling based on state
        isRevealed && !isGuessed 
          ? "text-muted-foreground/40" // Revealed but not guessed - dimmed
          : isGuessed 
            ? "text-foreground" // Guessed - normal color
            : "text-muted-foreground/80", // Default masked state
        isHighlighted && cn(
          "transition-all duration-200 rounded-md px-2 py-1",
          color ? `${color.bg} ${color.text}` : "bg-primary-muted/20"
        )
      )}
      style={{ 
        fontWeight: 'inherit', 
        fontSize: 'inherit', 
        padding: 0,
        fontFamily: 'inherit',
        letterSpacing: 'inherit'
      }}
    >
      {word}
    </span>
  );
});

WordRenderer.displayName = 'WordRenderer';

export function MaskedLyricsDisplay({
  title,
  artist,
  lyrics,
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  highlightedWord,
  scrollToWord,
  showFullLyrics = false,
  scrollContainerRef,
  guesses,
  clickedGuess
}: MaskedLyricsDisplayProps) {
  // Ref for scrolling to first match of scrollToWord
  const firstScrollToWordRef = useRef<HTMLSpanElement | null>(null);
  let foundFirstScrollToWord = false;

  // Scroll when scrollToWord changes
  useEffect(() => {
    if (firstScrollToWordRef.current && scrollToWord && scrollContainerRef?.current) {
      const wordEl = firstScrollToWordRef.current;
      const container = scrollContainerRef.current;
      const wordRect = wordEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = wordRect.top - containerRect.top - (containerRect.height / 2) + (wordRect.height / 2);
      container.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, [scrollToWord, scrollContainerRef]);

  // Determine what to display based on showFullLyrics
  const displayTitle = showFullLyrics && title ? title : null;
  const displayArtist = showFullLyrics && artist ? artist : null;
  const displayLyrics = showFullLyrics && lyrics ? lyrics : null;

  // Helper function to determine if a word is highlighted (clicked guess or hovered)
  const isWordHighlighted = (word: string): boolean => {
    return clickedGuess?.word.toLowerCase() === word.toLowerCase() || 
           highlightedWord?.toLowerCase() === word.toLowerCase() || 
           false;
  };

  const renderTitleAndArtist = () => {
    // Use masked parts if available, otherwise fall back to display text
    const titleParts = maskedTitleParts || (displayTitle ? displayTitle.split(' ').map(word => ({ value: word, isToGuess: true })) : []);
    const artistParts = maskedArtistParts || (displayArtist ? displayArtist.split(' ').map(word => ({ value: word, isToGuess: true })) : []);
    
    // Filter out non-word tokens (spaces, punctuation) for title and artist
    const filteredTitleParts = titleParts.filter(part => isWord(part.value));
    const filteredArtistParts = artistParts.filter(part => isWord(part.value));
    
    foundFirstScrollToWord = false; // Reset for each render
    
    return (
      <div className="text-xl sm:text-2xl font-bold tracking-wide mb-8">
        <div className="mb-2">
          <div>
            {filteredTitleParts.map((part, i) => {
              const isScrollToWord = scrollToWord && part.value.toLowerCase() === scrollToWord.toLowerCase();
              const isGuessed = guesses.some(g => g.valid && g.word.toLowerCase() === part.value.toLowerCase());
              const color = isGuessed ? getWordColorDeterministic(part.value) : undefined;
              let ref = undefined;
              if (isScrollToWord && !foundFirstScrollToWord) {
                ref = firstScrollToWordRef;
                foundFirstScrollToWord = true;
              }
              
              // Determine what word to display based on isToGuess and showFullLyrics
              const shouldShowWord = !part.isToGuess || showFullLyrics || color;
              const wordToDisplay = shouldShowWord ? part.value : '_'.repeat(part.value.length);
              const isRevealed = showFullLyrics && part.isToGuess;
              
              return (
                <React.Fragment key={`title-${i}`}>
                    <WordRenderer
                      word={wordToDisplay}
                      isHighlighted={isWordHighlighted(part.value)}
                      color={color}
                      isRevealed={isRevealed}
                      isGuessed={isGuessed}
                      ref={ref}
                    />
                  {i < filteredTitleParts.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-primary-muted font-normal">by</span>
          {filteredArtistParts.map((part, i) => {
            const isScrollToWord = scrollToWord && part.value.toLowerCase() === scrollToWord.toLowerCase();
            const isArtistGuessed = guesses.some(g => g.valid && g.word.toLowerCase() === part.value.toLowerCase());
            const color = isArtistGuessed ? getWordColorDeterministic(part.value) : undefined;
            let ref = undefined;
            if (isScrollToWord && !foundFirstScrollToWord) {
              ref = firstScrollToWordRef;
              foundFirstScrollToWord = true;
            }
            
            // Determine what word to display based on isToGuess and showFullLyrics
            const shouldShowWord = !part.isToGuess || showFullLyrics || color;
            const wordToDisplay = shouldShowWord ? part.value : '_'.repeat(part.value.length);
            const isRevealed = showFullLyrics && part.isToGuess;
            const isGuessed = !!color;
            
            return (
              <React.Fragment key={`artist-${i}`}>
                  <WordRenderer
                    word={wordToDisplay}
                    isHighlighted={isWordHighlighted(part.value)}
                    color={color}
                    isRevealed={isRevealed}
                    isGuessed={isGuessed}
                    ref={ref}
                  />
                {i < filteredArtistParts.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLyrics = () => {
    // Use masked parts if available, otherwise fall back to display text
    const lyricsParts = maskedLyricsParts || (displayLyrics ? splitIntoTokens(displayLyrics) : []);
    
    return (
      <div className="space-y-4">
        {lyricsParts.map((token, index) => {
          const tokenValue = typeof token === 'string' ? token : token.value;
          const isToGuess = typeof token === 'string' ? true : token.isToGuess;
          
          if (isWhitespace(tokenValue)) {
            // Preserve newlines by rendering them as line breaks
            if (tokenValue.includes('\n')) {
              return <br key={index} />;
            }
            // Render spaces as plain text without span wrapper
            return <React.Fragment key={index}>{tokenValue}</React.Fragment>;
          }
          
          if (isWord(tokenValue)) {
            const isScrollToWord = scrollToWord && tokenValue.toLowerCase() === scrollToWord.toLowerCase();
            const isLyricsGuessed = guesses.some(g => g.valid && g.word.toLowerCase() === tokenValue.toLowerCase());
            const color = isLyricsGuessed ? getWordColorDeterministic(tokenValue) : undefined;
            let ref = undefined;
            if (isScrollToWord && !foundFirstScrollToWord) {
              ref = firstScrollToWordRef;
              foundFirstScrollToWord = true;
            }
            
            // Determine what word to display based on isToGuess and showFullLyrics
            const shouldShowWord = !isToGuess || showFullLyrics || color;
            const wordToDisplay = shouldShowWord ? tokenValue : '_'.repeat(tokenValue.length);
            const isRevealed = showFullLyrics && isToGuess;
            
            return (
              <WordRenderer
                key={index}
                word={wordToDisplay}
                isHighlighted={isWordHighlighted(tokenValue)}
                color={color}
                isRevealed={isRevealed}
                isGuessed={isLyricsGuessed}
                ref={ref}
              />
            );
          }
          
          return <span key={index}>{tokenValue}</span>;
        })}
      </div>
    );
  };

  return (
    <div data-testid="masked-lyrics" className="space-y-6">
      {renderTitleAndArtist()}
      {renderLyrics()}
    </div>
  );
}


