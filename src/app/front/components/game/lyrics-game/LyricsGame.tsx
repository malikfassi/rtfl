"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ScrambleTitle } from '../ScrambleTitle';
import { GuessHistory, GuessInput, MaskedLyricsDisplay, WinPopup, GameTutorial, PathToVictory, ShareButton, LyricsLoadingComponent } from './index';
import { YesterdayStats } from '../YesterdayStats';
import { countTotalHits } from '@/app/front/lib/utils/hit-counting';
import { cn } from '@/app/front/lib/utils';
import type { LyricsGameProps } from './types';

export function LyricsGame({
  gameState, 
  onGuess, 
  onShowFullLyrics, 
  date,
  playerId
}: LyricsGameProps) {
  // UI state
  const [selectedGuess, setSelectedGuess] = useState<{ id: string; word: string } | null>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [scrollToWord, setScrollToWord] = useState<string | null>(null);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showTopFog, setShowTopFog] = useState(false);
  const [showBottomFog, setShowBottomFog] = useState(false);
  const [hasShownWinPopup, setHasShownWinPopup] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll for fog effect. Recomputed on every scroll AND whenever
  // the container's content actually changes (lyrics finish loading, full
  // lyrics get toggled on, a guess reveals more words...) via
  // MutationObserver - a scroll-only, mount-only check leaves the fog stuck
  // at whatever it was when the loading placeholder was still showing,
  // before the real (much taller) lyrics replace it.
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      setShowTopFog(scrollTop > 0);
      setShowBottomFog(scrollTop < scrollHeight - clientHeight - 1);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    const mutationObserver = new MutationObserver(handleScroll);
    mutationObserver.observe(scrollContainer, { childList: true, subtree: true, characterData: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      mutationObserver.disconnect();
    };
  }, []);

  // Tutorial modal localStorage logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dontShow = localStorage.getItem('lyricsGameDontShowTutorial');
      if (!dontShow) setShowTutorial(true);
    }
  }, []);
  const handleDontShowTutorial = () => {
    localStorage.setItem('lyricsGameDontShowTutorial', '1');
    setShowTutorial(false);
  };

  // Win condition detection
  useEffect(() => {
    if (gameState && gameState.song && !showWinPopup) {
      setShowWinPopup(true);
    }
  }, [gameState]);

  // Handle word hover from GuessHistory
  const handleWordHover = (word: string | null) => {
    console.log('[LyricsGame] handleWordHover called:', {
      word,
      type: typeof word,
      isNull: word === null,
      isUndefined: word === undefined
    });
    setHighlightedWord(word);
  };

  // Handle guess selection from GuessHistory
  const handleGuessSelect = (guess: { id: string; word: string } | null) => {
    setSelectedGuess(guess);
    if (guess) {
      setScrollToWord(guess.word);
      setHighlightedWord(guess.word);
    } else {
      setScrollToWord(null);
      setHighlightedWord(null);
    }
  };

  // Handle successful guess - select the last valid guess
  const handleSuccessfulGuess = (word: string) => {
    if (!gameState) return;
    
    // Find the last valid guess and select it
    const lastValidGuess = gameState.guesses
      .filter(g => g.valid)
      .pop();
    
    if (lastValidGuess) {
      setSelectedGuess({ id: lastValidGuess.id, word: lastValidGuess.word });
      setScrollToWord(lastValidGuess.word);
      setHighlightedWord(lastValidGuess.word);
    }
  };

  // Auto-select the most recent valid guess when guesses change
  // useEffect(() => {
  //   if (gameState?.guesses && gameState.guesses.length > 0) {
  //     const mostRecentValidGuess = gameState.guesses
  //       .filter(g => g.valid)
  //       .pop();
  //     
  //     if (mostRecentValidGuess) {
  //       setSelectedGuess({ id: mostRecentValidGuess.id, word: mostRecentValidGuess.word });
  //       setScrollToWord(mostRecentValidGuess.word);
  //       setHighlightedWord(mostRecentValidGuess.word);
  //     }
  //   }
  // }, [gameState?.guesses]);

  // Handle guess submission. onGuess resolves with the freshly-fetched
  // GameState from the mutation response - using that directly (rather than
  // the parent's gameState, which hasn't re-rendered with this guess yet)
  // avoids the classic stale-props bug where the hit count and selection
  // shown after submitting reflect the previous guess, not this one.
  const handleGuessSubmit = async (guess: string): Promise<number> => {
    setPendingGuess(guess);
    try {
      const freshState = await onGuess(guess);
      if (!freshState) return 0;

      const submittedGuess = freshState.guesses
        .filter(g => g.word.toLowerCase() === guess.toLowerCase() && g.valid)
        .pop();
      if (submittedGuess) {
        setSelectedGuess({ id: submittedGuess.id, word: submittedGuess.word });
        setScrollToWord(submittedGuess.word);
        setHighlightedWord(submittedGuess.word);
      }

      return countTotalHits({
        word: guess,
        maskedLyricsParts: freshState.masked.lyrics,
        maskedTitleParts: freshState.masked.title,
        maskedArtistParts: freshState.masked.artist,
      });
    } finally {
      setPendingGuess(null);
    }
  };

  // Handle duplicate guess - find and select the existing guess
  const handleDuplicateGuess = (guess: string) => {
    if (!gameState) return;
    const existingGuess = gameState.guesses.find(g => g.word.toLowerCase() === guess.toLowerCase());
    if (existingGuess) {
      setSelectedGuess({ id: existingGuess.id, word: existingGuess.word });
      setScrollToWord(existingGuess.word);
      setHighlightedWord(existingGuess.word);
    }
  };

  // Debug logging for highlightedWord state changes
  useEffect(() => {
    console.log('[LyricsGame] highlightedWord state changed:', {
      highlightedWord,
      type: typeof highlightedWord,
      isNull: highlightedWord === null,
      isUndefined: highlightedWord === undefined
    });
  }, [highlightedWord]);

  // Check if game is complete (has song data)
  const isGameComplete = !!gameState?.song;
  const isLoading = !gameState;

  // Debug logging for PathToVictory props
  useEffect(() => {
    console.log('[LyricsGame] PathToVictory props:', {
      highlightedWord,
      isLoading,
      guessesLength: isLoading ? 0 : gameState?.guesses?.length,
      gameStateExists: !!gameState
    });
  }, [highlightedWord, isLoading, gameState]);

  // Placeholder/fake data for loading state
  const loadingGuesses = Array.from({ length: 5 }, () => ({ id: `loading-${Math.random()}`, word: '...', valid: true }));
  const loadingMasked = Array.from({ length: 10 }, () => ({ value: '_', isToGuess: false }));

  // Show win popup logic
  useEffect(() => {
    if (isGameComplete && !hasShownWinPopup) {
      setShowWinPopup(true);
      setHasShownWinPopup(true);
    }
  }, [isGameComplete, hasShownWinPopup]);

  // Countdown timer for next game
  const [nextGameTimer, setNextGameTimer] = useState('00:00:00');
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setNextGameTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get player ID from gameState or use provided playerId
  const displayPlayerId = playerId || 'anonymous';

  // Real PathToVictory progress computation
  const pathToVictoryProps = gameState ? (() => {
    // Count total words in each section
    const titleWords = gameState.masked.title.filter(token => token.isToGuess).length;
    const artistWords = gameState.masked.artist.filter(token => token.isToGuess).length;
    const lyricsWords = gameState.masked.lyrics.filter(token => token.isToGuess).length;
    
    // Count found words in each section
    const validGuesses = gameState.guesses.filter(g => g.valid).map(g => g.word.toLowerCase());
    
    const titleFound = gameState.masked.title
      .filter(token => token.isToGuess)
      .filter(token => validGuesses.includes(token.value.toLowerCase())).length;
    
    const artistFound = gameState.masked.artist
      .filter(token => token.isToGuess)
      .filter(token => validGuesses.includes(token.value.toLowerCase())).length;
    
    const lyricsFound = gameState.masked.lyrics
      .filter(token => token.isToGuess)
      .filter(token => validGuesses.includes(token.value.toLowerCase())).length;
    
    // Calculate total words and found words
    const totalWords = titleWords + artistWords + lyricsWords;
    const foundWords = titleFound + artistFound + lyricsFound;
    
    return {
      lyricsProgress: { found: lyricsFound, total: lyricsWords },
      titleProgress: { found: titleFound, total: titleWords },
      artistProgress: { found: artistFound, total: artistWords },
      totalWords,
      foundWords,
      isGameComplete
    };
  })() : {
    lyricsProgress: { found: 0, total: 0 },
    titleProgress: { found: 0, total: 0 },
    artistProgress: { found: 0, total: 0 },
    totalWords: 0,
    foundWords: 0,
    isGameComplete: false
  };

  // Placeholder for ShareButton stats (TODO: real logic)
  const shareButtonStats = gameState ? {
    gameStats: {
      totalGuesses: gameState.guesses.length,
      correctGuesses: gameState.guesses.filter(g => g.valid).length,
      accuracy: gameState.guesses.length ? Math.round(100 * gameState.guesses.filter(g => g.valid).length / gameState.guesses.length) : 0,
      wordsFound: gameState.guesses.filter(g => g.valid).length
    },
    songInfo: {
      title: gameState.song?.title,
      artist: gameState.song?.artist
    },
    date
  } : {
    gameStats: { totalGuesses: 0, correctGuesses: 0, accuracy: 0, wordsFound: 0 },
    songInfo: { title: '', artist: '' },
    date
  };

  useEffect(() => {
    if (gameState) {
      console.log('[LyricsGame] masked.lyrics:', gameState.masked.lyrics);
      console.log('[LyricsGame] masked.title:', gameState.masked.title);
      console.log('[LyricsGame] masked.artist:', gameState.masked.artist);
    }
  }, [gameState]);

  return (
    <div data-testid="game-container" className="min-h-screen bg-background text-foreground">
      {/* Game Header with playerId and next game timer */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col h-auto max-w-screen-2xl py-2">
          <ScrambleTitle date={date} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Player: {displayPlayerId}</span>
            <span className="text-xs text-muted-foreground">Next game in: {nextGameTimer}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-screen-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_160px] gap-6 py-6">
          {/* Left Column - Game Controls */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Path To Victory */}
              <PathToVictory 
                {...pathToVictoryProps} 
                guesses={isLoading ? loadingGuesses : gameState.guesses}
                highlightedWord={highlightedWord}
                maskedLyricsParts={isLoading ? loadingMasked : gameState.masked.lyrics}
                maskedTitleParts={isLoading ? loadingMasked : gameState.masked.title}
                maskedArtistParts={isLoading ? loadingMasked : gameState.masked.artist}
                showFullLyrics={showFullLyrics}
                onToggleFullLyrics={setShowFullLyrics}
              />
              {/* Guess Input */}
              <GuessInput
                onGuessSubmit={handleGuessSubmit}
                pendingGuess={pendingGuess}
                disabled={isGameComplete || isLoading}
                onDuplicateGuess={handleDuplicateGuess}
              />
              {/* Guess History */}
              <GuessHistory
                guesses={isLoading ? loadingGuesses : gameState.guesses}
                maskedLyrics={isLoading ? '...' : gameState.masked.lyrics.map(t => t.value).join(' ')}
                maskedTitle={isLoading ? '...' : gameState.masked.title.map(t => t.value).join(' ')}
                maskedArtist={isLoading ? '...' : gameState.masked.artist.map(t => t.value).join(' ')}
                maskedTitleParts={isLoading ? loadingMasked : gameState.masked.title}
                maskedArtistParts={isLoading ? loadingMasked : gameState.masked.artist}
                maskedLyricsParts={isLoading ? loadingMasked : gameState.masked.lyrics}
                onWordHover={handleWordHover}
                selectedGuess={selectedGuess}
                onGuessSelect={handleGuessSelect}
              />
              {/* Yesterday Stats (placeholder for now) */}
              {isGameComplete && (
                <YesterdayStats currentDate={date} />
              )}
            </div>
          </div>

          {/* Center Column - Lyrics Display */}
          <div className="lg:col-span-1">
            <div 
              ref={scrollContainerRef}
              className="h-[calc(100vh-8rem)] overflow-y-auto pr-0 no-scrollbar relative scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Fog fadeout effect - only show when scrolling */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none transition-opacity duration-300",
                showTopFog ? "opacity-100" : "opacity-0"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none transition-opacity duration-300",
                showBottomFog ? "opacity-100" : "opacity-0"
              )} />
              
              {/* Reveal lyrics button - only show when victory is achieved */}
              {isGameComplete && (
                <div className="absolute top-4 right-4 z-20">
                  <label className="flex items-center cursor-pointer select-none bg-background/80 backdrop-blur rounded-lg px-3 py-2 border border-border/50">
                    <span className="mr-2 text-xs text-primary-muted/80">Reveal lyrics</span>
                    <span className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        checked={showFullLyrics}
                        onChange={e => setShowFullLyrics(e.target.checked)}
                        className="absolute block w-5 h-5 rounded-full bg-accent-warning border-2 border-accent-warning appearance-none cursor-pointer transition-all duration-200 checked:bg-accent-success checked:border-accent-success"
                        style={{ left: showFullLyrics ? '1.2rem' : '0', top: 0, transition: 'left 0.2s' }}
                      />
                      <span className="block overflow-hidden h-5 rounded-full bg-accent-warning/15 border border-accent-warning/60 w-8"></span>
                    </span>
                  </label>
                </div>
              )}
              
              {isLoading ? (
                <LyricsLoadingComponent />
              ) : (
                <MaskedLyricsDisplay
                  title={showFullLyrics ? gameState.song?.title : undefined}
                  artist={showFullLyrics ? gameState.song?.artist : undefined}
                  lyrics={showFullLyrics ? gameState.song?.lyrics : undefined}
                  maskedTitleParts={gameState.masked.title}
                  maskedArtistParts={gameState.masked.artist}
                  maskedLyricsParts={gameState.masked.lyrics}
                  highlightedWord={highlightedWord}
                  scrollToWord={scrollToWord}
                  showFullLyrics={showFullLyrics}
                  scrollContainerRef={scrollContainerRef}
                  guesses={gameState.guesses}
                  clickedGuess={selectedGuess}
                />
              )}
            </div>
          </div>

          {/* Right Column - Share, Stats, Spotify */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Share Button */}
              <ShareButton {...shareButtonStats} />
              {/* TODO: Add SpotifyPlayer here when implemented */}
            </div>
          </div>
        </div>
      </div>

      {/* Win Condition Popup */}
      <WinPopup
        isOpen={showWinPopup}
        onClose={() => setShowWinPopup(false)}
        gameStats={shareButtonStats.gameStats}
        onShare={() => {/* Share functionality handled by ShareButton component */}}
        onShowFullLyrics={onShowFullLyrics}
        showFullLyrics={showFullLyrics}
      />
      {/* Game Tutorial Popup */}
      <GameTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onDontShowAgain={handleDontShowTutorial}
      />
      {/* Show Full Lyrics Button (floating) */}
      {/* Remove the floating purple 'show full lyrics' button at the bottom right.
          Only pass showFullLyrics to MaskedLyricsDisplay, and do not reveal lyrics on win by default. */}
    </div>
  );
}
