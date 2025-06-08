"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGameState, useGuess } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { cn } from "@/app/front/lib/utils";
import {
  GameControls,
  GameProgress,
  MaskedLyrics,
  YesterdayStats,
} from "./lyrics-game";
import { ScrambleTitle } from "./ScrambleTitle";
import { DateDisplay } from "./DateDisplay";
import { isMatch } from 'date-fns';

interface LyricsGameProps {
  date: string;
  game: any;
  disabled?: boolean;
  isAdmin?: boolean;
  onChooseSong?: () => void;
  hideChooseSongButton?: boolean;
}

const colors = [
  { bg: "bg-accent-info/20", text: "text-accent-info" },
  { bg: "bg-accent-success/20", text: "text-accent-success" },
  { bg: "bg-accent-warning/25", text: "text-accent-warning" },
  { bg: "bg-accent-error/20", text: "text-accent-error" },
  { bg: "bg-primary-dark/20", text: "text-primary-dark" },
];

export function LyricsGame({ date, game, disabled = false, isAdmin = false, onChooseSong, hideChooseSongButton = false }: LyricsGameProps) {
  const isValidDate = !!date && isMatch(date, 'yyyy-MM-dd');
  
  // Check if date is in the future
  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = date > today;

  const playerId = getOrCreatePlayerId();
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<{ id: string; word: string } | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  
  // Only fetch game state if we don't have game information yet
  // - If game is undefined, we need to fetch to find out
  // - If game is null, we know there's no game (don't fetch)
  // - If game is an object, we already have the game (don't fetch)
  const shouldFetchGame = game === undefined && !isFutureDate;
  const { data: gameState, isLoading: isGameLoading, error: gameError } = useGameState(playerId, date, shouldFetchGame);
  
  // Setup guess mutation
  const guessMutation = useGuess(playerId, date);

  // Track if share popup has been shown for this win
  const hasSharedRef = useRef(false);

  // Get total words to find (only masked words)
  const lyrics = typeof gameState?.masked?.lyrics === 'string' ? gameState.masked.lyrics : '';
  const totalWords = Array.from(lyrics.matchAll(/_{2,}/g)).length;
  
  // Get total found word occurrences (not unique)
  const foundWordsCount = gameState?.guesses
    ?.filter((g: { valid: boolean }) => g.valid)
    .reduce((count: number, g: { id: string; valid: boolean; word: string }) => {
      const words = Array.from(lyrics.matchAll(/\p{L}+|\p{N}+/gu), (m: RegExpMatchArray) => m[0]) as string[];
      const hits = words.filter((word: string) => 
        word.toLowerCase() === g.word.toLowerCase()
      ).length;
      return count + hits;
    }, 0) || 0;
  
  const wordsFoundPercentage = Math.round((foundWordsCount / totalWords) * 100);
  
  // Calculate segments for each valid guess
  const guessSegments = gameState?.guesses
    ?.filter((g: { valid: boolean }) => g.valid)
    .map((g: { id: string; valid: boolean; word: string }) => {
      const words = Array.from(lyrics.matchAll(/\p{L}+|\p{N}+/gu), (m: RegExpMatchArray) => m[0]) as string[];
      const hits = words.filter((word: string) => 
        word.toLowerCase() === g.word.toLowerCase()
      ).length;
      return {
        id: g.id,
        hits,
        colorIndex: gameState.guesses.findIndex((g: { id: string }) => g.id === g.id) % colors.length
      };
    })
    .filter((segment: { hits: number }) => segment.hits > 0) || [];

  // Calculate completion percentages
  const foundWords: string[] = Array.from(new Set(
    gameState?.guesses
      ?.filter((g: { valid: boolean }) => g.valid)
      .map((g: { word: string }) => g.word.toLowerCase()) || []
  ));

  // Convert masked fields from arrays to strings if needed
  const maskedTitle = Array.isArray(gameState?.masked?.title)
    ? gameState.masked.title.map((part: { value: string }) => part.value).join('')
    : (typeof gameState?.masked?.title === 'string' ? gameState.masked.title : '');
  const maskedArtist = Array.isArray(gameState?.masked?.artist)
    ? gameState.masked.artist.map((part: { value: string }) => part.value).join('')
    : (typeof gameState?.masked?.artist === 'string' ? gameState.masked.artist : '');
  const maskedLyrics = Array.isArray(gameState?.masked?.lyrics)
    ? gameState.masked.lyrics.map((part: { value: string }) => part.value).join('')
    : (typeof gameState?.masked?.lyrics === 'string' ? gameState.masked.lyrics : '');

  // Pass the raw arrays for masking logic
  const maskedTitleParts = Array.isArray(gameState?.masked?.title) ? gameState.masked.title : undefined;
  const maskedArtistParts = Array.isArray(gameState?.masked?.artist) ? gameState.masked.artist : undefined;
  const maskedLyricsParts = Array.isArray(gameState?.masked?.lyrics) ? gameState.masked.lyrics : undefined;

  // Partitioned progress calculation
  const getProgress = (maskedParts: Array<{ value: string; isToGuess: boolean }> | undefined) => {
    if (!maskedParts) return { found: 0, total: 0 };
    const hiddenWords = maskedParts.filter(token => token.isToGuess).map(token => token.value.toLowerCase());
    const total = hiddenWords.length;
    const found = hiddenWords.filter(word => foundWords.includes(word)).length;
    return { found, total };
  };

  const lyricsProgressData = getProgress(maskedLyricsParts);
  const titleProgressData = getProgress(maskedTitleParts);
  const artistProgressData = getProgress(maskedArtistParts);

  // Winning conditions
  const lyricsWin = lyricsProgressData.total > 0 && lyricsProgressData.found / lyricsProgressData.total >= 0.8;
  const titleWin = titleProgressData.total > 0 && titleProgressData.found === titleProgressData.total;
  const artistWin = artistProgressData.total > 0 && artistProgressData.found === artistProgressData.total;
  const isGameComplete = lyricsWin || (titleWin && artistWin);

  useEffect(() => {
    if (isGameComplete && !hasSharedRef.current) {
      hasSharedRef.current = true;
      handleShare();
    }
    if (!isGameComplete) {
      hasSharedRef.current = false;
    }
  }, [isGameComplete]);

  if (!isValidDate) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh] text-accent-error">
          Invalid or missing date
        </div>
      </div>
    );
  }

  if (isFutureDate) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh] text-accent-warning">
          <div className="text-center">
            <div className="text-2xl mb-2">🚫</div>
            <div className="text-lg font-medium mb-2">Can't access future games!</div>
            <div className="text-sm">Come back on {date} to play this game.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isGameLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh]">
          Loading...
        </div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh] text-accent-error">
          {gameError instanceof Error ? gameError.message : 'An error occurred'}
        </div>
      </div>
    );
  }

  // Handle cases where we know there's no game or need to show empty state
  if (game === null || (disabled && !game)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-6xl flex flex-col lg:flex-row">
              {/* Left Panel */}
              <div className="w-full lg:w-[320px] lg:min-w-[320px]">
                <div className="h-full flex flex-col p-4 lg:p-6">
                  <div className="space-y-6 pb-6">
                    <ScrambleTitle date={date} />
                    <div className="space-y-4">
                      <div className="mt-4 flex flex-wrap items-center gap-x-2">
                        <div className="text-xs md:text-sm font-medium text-accent-info">Player ID</div>
                        <div className="text-xs md:text-sm font-mono text-accent-info/80 truncate max-w-[10rem] relative group cursor-pointer">
                          <span>{`#${playerId}`}</span>
                          <span className="absolute left-0 top-full mt-1 min-w-full px-2 py-1 rounded border border-primary-muted/30 bg-transparent text-xs font-mono text-primary-dark max-w-xs whitespace-pre break-all hidden group-hover:block group-focus-within:block group-active:block">
                            #{playerId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Disabled Game Controls */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-gray-400">Progress</div>
                        <div className="text-gray-400">0%</div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Type your guess..."
                        disabled
                        className="w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-400 cursor-not-allowed"
                      />
                      <div className="text-center p-4 bg-orange-50 text-orange-600 rounded-md text-sm">
                        No game available for this date
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content - Disabled Lyrics */}
              <div className="flex-1 p-4 lg:p-8">
                <div className="w-full space-y-6 pl-4 sm:pl-8">
                  {/* Fake Title and Artist */}
                  <div className="text-xl sm:text-2xl font-bold tracking-wide mb-8">
                    <div className="mb-2">
                      <div className="space-x-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className="inline-block bg-gray-200 h-6 rounded" style={{ width: `${60 + Math.random() * 40}px` }}></span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-lg sm:text-xl">
                      <span className="text-gray-400 font-normal">by</span>
                      {Array.from({ length: 2 }).map((_, i) => (
                        <span key={i} className="inline-block bg-gray-200 h-5 rounded" style={{ width: `${40 + Math.random() * 30}px` }}></span>
                      ))}
                    </div>
                  </div>

                  {/* Fake Lyrics */}
                  <div className="font-mono text-sm leading-relaxed space-y-2">
                    {Array.from({ length: 8 }).map((_, lineIndex) => (
                      <div key={lineIndex} className="mb-2 flex flex-wrap gap-1">
                        {Array.from({ length: 6 + Math.floor(Math.random() * 4) }).map((_, wordIndex) => (
                          <span 
                            key={wordIndex} 
                            className="inline-block bg-gray-200 h-4 rounded"
                            style={{ width: `${30 + Math.random() * 50}px` }}
                          ></span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh] text-primary-muted">
          No game available for this date
        </div>
      </div>
    );
  }

  const handleGuess = async (guess: string) => {
    try {
      await guessMutation.mutateAsync(guess);
      setGuessError(null);
      // Automatically select the last valid guess
      const lastValid = gameState?.guesses?.filter((g: { valid: boolean }) => g.valid).slice(-1)[0];
      if (lastValid) setSelectedGuess({ id: lastValid.id, word: lastValid.word });
    } catch (error) {
      setGuessError(error instanceof Error ? error.message : "Failed to submit guess");
    }
  };

  // Calculate completion percentages - simplified
  const foundArtistWords = 0;
  const foundTitleWords = 0;
  const artistCompleteGuess = undefined;
  const titleCompleteGuess = undefined;

  const lyricsProgress = foundWordsCount / totalWords;

  // Share functionality
  const handleShare = () => {
    const lyricsPercent = lyricsProgressData.total > 0 ? Math.round((lyricsProgressData.found / lyricsProgressData.total) * 100) : 0;
    const titlePercent = titleProgressData.total > 0 ? Math.round((titleProgressData.found / titleProgressData.total) * 100) : 0;
    const artistPercent = artistProgressData.total > 0 ? Math.round((artistProgressData.found / artistProgressData.total) * 100) : 0;
    const guessCount = gameState.guesses.filter(g => g.valid).length;
    let shareText = '';
    if (isGameComplete) {
      const stats = [
        `🎵 Lyrics: ${lyricsPercent}%`,
        `📝 Title: ${titlePercent}%`, 
        `👤 Artist: ${artistPercent}%`,
        `💭 Guesses: ${guessCount}`
      ].join('\n');
      shareText = `🎯  Just played RTFL - Read the F***ing Lyrics!\n\n${stats}\n\nThink you can do better? 🎯`;
    } else {
      shareText = `I'm trying to solve today's RTFL lyrics challenge! Can you help me?\n\nPlay here:`;
    }
    const gameUrl = `${window.location.origin}/game/${date}`;
    
    // Create share options
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
    
    // For now, copy to clipboard and show options
    const fullText = `${shareText}\n\n${gameUrl}`;
    navigator.clipboard.writeText(fullText).then(() => {
      // Show share options modal or dropdown
      const shareLinks = document.createElement('div');
      shareLinks.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      
      // Escape HTML to prevent XSS
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      shareLinks.innerHTML = `
        <div class="bg-background rounded-lg p-6 max-w-sm mx-4 space-y-4 border border-primary-muted/20">
          <h3 class="font-bold text-lg mb-4 text-primary-dark">Challenge your friends!</h3>
          <div class="bg-primary-muted/5 rounded-lg p-3 mb-4">
            <div class="text-sm text-primary-dark whitespace-pre-line font-mono leading-relaxed">
${escapeHtml(shareText).replace(/\n/g, '<br>')}
            </div>
            <div class="text-xs text-accent-info mt-2 break-all">${escapeHtml(gameUrl)}</div>
          </div>
          <div class="space-y-3">
            <a href="${twitterUrl}" target="_blank" class="block w-full px-4 py-3 bg-accent-info/10 text-accent-info rounded-lg text-center hover:bg-accent-info/20 transition-colors font-medium">
              🐦 Share on Twitter
            </a>
            <a href="${facebookUrl}" target="_blank" class="block w-full px-4 py-3 bg-accent-success/10 text-accent-success rounded-lg text-center hover:bg-accent-success/20 transition-colors font-medium">
              📘 Share on Facebook
            </a>
            <button class="w-full px-4 py-3 bg-primary-muted/10 text-primary-dark rounded-lg hover:bg-primary-muted/20 transition-colors font-medium" onclick="this.textContent='✅ Copied!'; setTimeout(() => this.remove(), 1000)">
              📋 Link copied to clipboard!
            </button>
          </div>
          <button class="w-full px-4 py-2 text-primary-muted hover:text-primary-dark transition-colors font-medium" onclick="this.closest('.fixed').remove()">
            Cancel
          </button>
        </div>
      `;
      
      shareLinks.addEventListener('click', (e) => {
        if (e.target === shareLinks) {
          shareLinks.remove();
        }
      });
      
      document.body.appendChild(shareLinks);
    });
  };

  // Toggle lyrics functionality
  const handleToggleLyrics = () => {
    setShowFullLyrics(!showFullLyrics);
  };

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Main Game Area */}
      <div className="px-4 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:[grid-template-columns:1fr_2.2fr_1fr] gap-4 lg:gap-8">
            {/* Left Panel - Game Controls */}
            <div className="order-1 lg:order-1">
              <div className="sticky top-8">
                {/* Title and Player ID */}
                <div className="mb-6">
                  <ScrambleTitle date={date} />
                  <div className="mt-2 flex flex-wrap items-center gap-x-2">
                    <div className="text-[10px] font-medium text-accent-info">Player ID</div>
                    <div className="text-[10px] font-mono text-accent-info/80" style={{paddingTop: 0, paddingBottom: 0}} title={playerId}>#{playerId}</div>
                  </div>
                </div>
                {/* Progress for mobile */}
                <GameProgress 
                  lyricsFound={lyricsProgressData.found}
                  lyricsTotal={lyricsProgressData.total}
                  titleFound={titleProgressData.found}
                  titleTotal={titleProgressData.total}
                  artistFound={artistProgressData.found}
                  artistTotal={artistProgressData.total}
                  lyricsWin={lyricsWin}
                  titleWin={titleWin}
                  artistWin={artistWin}
                  className="mb-6"
                />
                <GameControls
                  playerId={playerId}
                  date={date}
                  isGameComplete={false}
                  guesses={gameState.guesses}
                  maskedLyrics={maskedLyrics}
                  maskedTitle={maskedTitle}
                  maskedArtist={maskedArtist}
                  maskedTitleParts={maskedTitleParts}
                  maskedArtistParts={maskedArtistParts}
                  maskedLyricsParts={maskedLyricsParts}
                  onGuess={handleGuess}
                  isSubmitting={guessMutation.isPending}
                  onWordHover={setHoveredWord}
                  selectedGuess={selectedGuess}
                  onGuessSelect={setSelectedGuess}
                  colors={colors}
                />
              </div>
            </div>
            {/* Center Panel - Lyrics */}
            <div className="order-2 lg:order-2">
              <MaskedLyrics
                title={maskedTitle}
                artist={maskedArtist}
                lyrics={maskedLyrics}
                maskedTitleParts={maskedTitleParts}
                maskedArtistParts={maskedArtistParts}
                maskedLyricsParts={maskedLyricsParts}
                isComplete={isGameComplete}
                foundWords={foundWords}
                hoveredWord={hoveredWord}
                selectedWord={selectedGuess?.word}
                guesses={gameState.guesses}
                colors={colors}
                song={gameState.song}
                isAdmin={isAdmin}
                showFullLyrics={showFullLyrics}
              />
              {/* Ystd game always at bottom of lyrics on mobile */}
              <div className="block lg:hidden mt-6">
                <YesterdayStats currentDate={date} />
              </div>
            </div>
            {/* Right Panel - Media & Actions */}
            <div className="order-3 lg:order-3">
              <div className="sticky top-8 space-y-4">
                {/* Spotify Player */}
                {isGameComplete && gameState.song?.spotifyId && (
                  <div className="rounded-lg overflow-hidden bg-white/5">
                    <iframe
                      src={`https://open.spotify.com/embed/track/${gameState.song.spotifyId}?utm_source=generator`}
                      width="100%"
                      height="152"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="border-0"
                    />
                  </div>
                )}
                {/* Victory Actions */}
                {isGameComplete && (
                  <div className="space-y-3">
                    <button
                      onClick={handleToggleLyrics}
                      className="w-full px-4 py-3 bg-primary-muted/10 hover:bg-primary-muted/20 text-primary-dark rounded-lg transition-colors font-medium"
                    >
                      {showFullLyrics ? "Hide" : "Reveal"} Full Lyrics
                    </button>
                  </div>
                )}
                {/* Always show share button */}
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-3 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info rounded-lg transition-colors font-medium"
                >
                  Challenge your friends
                </button>
                {/* Yesterday's Game Stats (desktop only) */}
                <YesterdayStats 
                  currentDate={date}
                  className="hidden lg:block"
                />
                {/* TODO: Path to victory highlight - locate and style this section */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 