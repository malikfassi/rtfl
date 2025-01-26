"use client";

import React, { useState } from "react";
import { useGameState, useGuess } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { cn } from "@/app/front/lib/utils";
import {
  GameControls,
  GameProgress,
  MaskedLyrics,
} from "./lyrics-game";
import { ScrambleTitle } from "./ScrambleTitle";
import { DateDisplay } from "./DateDisplay";

interface LyricsGameProps {
  date: string;
}

const colors = [
  { bg: "bg-accent-info", text: "text-accent-info" },
  { bg: "bg-accent-success", text: "text-accent-success" },
  { bg: "bg-accent-warning", text: "text-accent-warning" },
  { bg: "bg-accent-error", text: "text-accent-error" },
  { bg: "bg-primary-dark", text: "text-primary-dark" },
];

export function LyricsGame({ date }: LyricsGameProps) {
  const playerId = getOrCreatePlayerId();
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<{ id: string; word: string } | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  
  // Fetch current game state
  const { data: gameState, isLoading: isGameLoading, error: gameError } = useGameState(playerId, date);
  
  // Setup guess mutation
  const guessMutation = useGuess(playerId, date);

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

  if (!gameState) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh] text-primary-muted">
          No game state available
        </div>
      </div>
    );
  }

  const handleGuess = async (guess: string) => {
    try {
      await guessMutation.mutateAsync(guess);
      setGuessError(null);
    } catch (error) {
      setGuessError(error instanceof Error ? error.message : "Failed to submit guess");
    }
  };

  // Get total words from lyrics (not unique)
  const totalWords = Array.from(gameState.masked.lyrics.matchAll(/\p{L}+|\p{N}+/gu), m => m[0]).length;
  
  // Get total found word occurrences (not unique)
  const foundWordsCount = gameState.guesses
    .filter(g => g.valid)
    .reduce((count, guess) => {
      const words = Array.from(gameState.masked.lyrics.matchAll(/\p{L}+|\p{N}+/gu), m => m[0]);
      const hits = words.filter(word => 
        word.toLowerCase() === guess.word.toLowerCase()
      ).length;
      return count + hits;
    }, 0);
  
  const wordsFoundPercentage = Math.round((foundWordsCount / totalWords) * 100);
  
  // Calculate segments for each valid guess
  const guessSegments = gameState.guesses
    .filter(g => g.valid)
    .map((guess) => {
      const words = Array.from(gameState.masked.lyrics.matchAll(/\p{L}+|\p{N}+/gu), m => m[0]);
      const hits = words.filter(word => 
        word.toLowerCase() === guess.word.toLowerCase()
      ).length;
      return {
        id: guess.id,
        hits,
        colorIndex: gameState.guesses.findIndex(g => g.id === guess.id) % colors.length
      };
    })
    .filter(segment => segment.hits > 0);

  // Calculate completion percentages
  const artistWords = Array.from(new Set(
    gameState.masked.artist
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  ));
  
  const titleWords = Array.from(new Set(
    gameState.masked.title
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  ));

  const foundWords = Array.from(new Set(
    gameState.guesses
      .filter(g => g.valid)
      .map(g => g.word.toLowerCase())
  ));

  const foundArtistWords = artistWords.filter(word => 
    foundWords.includes(word.toLowerCase())
  ).length;
  const foundTitleWords = titleWords.filter(word => 
    foundWords.includes(word.toLowerCase())
  ).length;

  const artistCompleteGuess = gameState.guesses.find(g => {
    const guessWord = g.word.toLowerCase();
    return artistWords.some(word => word.toLowerCase() === guessWord) &&
           foundArtistWords === artistWords.length;
  })?.id;

  const titleCompleteGuess = gameState.guesses.find(g => {
    const guessWord = g.word.toLowerCase();
    return titleWords.some(word => word.toLowerCase() === guessWord) &&
           foundTitleWords === titleWords.length;
  })?.id;

  const lyricsProgress = foundWordsCount / totalWords;

  const isGameComplete = gameState.song !== undefined || 
    (!!artistCompleteGuess && !!titleCompleteGuess) || 
    lyricsProgress >= 0.8;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout Container */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Center Content Container */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row">
            {/* Left Panel / Top Header */}
            <div className="w-full lg:w-[320px] lg:min-w-[320px]">
              <div className="h-full flex flex-col p-4 lg:p-6">
                {/* Header Information */}
                <div className="space-y-6 pb-6">
                  <ScrambleTitle date={date} />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-accent-info">Player ID</div>
                      <div className="text-xs font-mono text-accent-info/80">#{playerId}</div>
                    </div>
                    {isGameComplete && gameState.song?.spotifyId && (
                      <div className="rounded-lg overflow-hidden bg-primary-muted/5">
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
                  </div>
                </div>

                {/* Game Controls */}
                <div className="flex-1 flex flex-col min-h-0">
                  <GameProgress 
                    foundWords={foundWordsCount} 
                    totalWords={totalWords} 
                    className="mb-6"
                    hoveredGuess={selectedGuess?.id}
                    guessSegments={guessSegments}
                    artistComplete={artistCompleteGuess}
                    titleComplete={titleCompleteGuess}
                    colors={colors}
                    onSegmentHover={(guessId) => {
                      const guess = gameState.guesses.find(g => g.id === guessId);
                      setSelectedGuess(guess ? { id: guess.id, word: guess.word } : null);
                    }}
                  />
                  <GameControls
                    playerId={playerId}
                    date={date}
                    isGameComplete={false}
                    guesses={gameState.guesses}
                    maskedLyrics={gameState.masked.lyrics}
                    onGuess={handleGuess}
                    isSubmitting={guessMutation.isPending}
                    onWordHover={setHoveredWord}
                    selectedGuess={selectedGuess}
                    onGuessSelect={setSelectedGuess}
                    colors={colors}
                  />
                </div>
              </div>
            </div>

            {/* Main Content - Lyrics */}
            <div className="flex-1 p-4 lg:p-8">
              <div className="w-full">
                <MaskedLyrics
                  title={gameState.masked.title}
                  artist={gameState.masked.artist}
                  lyrics={isGameComplete && gameState.song ? gameState.song.lyrics : gameState.masked.lyrics}
                  isComplete={isGameComplete}
                  foundWords={foundWords}
                  hoveredWord={hoveredWord}
                  selectedWord={selectedGuess?.word}
                  guesses={gameState.guesses}
                  colors={colors}
                  song={gameState.song}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 