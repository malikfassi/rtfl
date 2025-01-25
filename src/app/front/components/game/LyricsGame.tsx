"use client";

import React, { useState } from "react";
import { useToast } from "@/app/front/hooks/use-toast";
import { cn } from "@/app/front/lib/utils";
import { Input } from "@/app/front/components/ui/Input";
import { useGameState, useGuess } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { format } from "date-fns";
import { ScrambleTitle } from "./ScrambleTitle";

interface LyricsGameProps {
  date: string;
}

export function LyricsGame({ date }: LyricsGameProps) {
  const [guess, setGuess] = useState("");
  const playerId = getOrCreatePlayerId();
  
  // Fetch current game state
  const { data: gameState, isLoading: isGameLoading, error: gameError } = useGameState(playerId, date);
  
  // Setup guess mutation
  const guessMutation = useGuess(playerId, date);
  const { toast } = useToast();

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
        <div className="flex justify-center items-center min-h-[50vh] text-red-500">
          {gameError instanceof Error ? gameError.message : 'An error occurred'}
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-[50vh]">
          No game state available
        </div>
      </div>
    );
  }

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;

    const normalizedGuess = guess.toLowerCase().trim();

    try {
      await guessMutation.mutateAsync(normalizedGuess);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit guess",
        variant: "destructive",
      });
    }
    setGuess("");
  };

  const words = gameState.masked.lyrics.split(" ");
  const foundWords = gameState.guesses.map(g => g.word.toLowerCase());
  const progress = `${foundWords.length}/${words.length}`;
  const isGameComplete = foundWords.length === words.length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Game Controls */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <ScrambleTitle />
            
            <div className="text-sm text-purple-400 mt-6 mb-4">
              Player #{playerId}
            </div>

            <div className="text-xl font-bold mb-6">
              {format(new Date(date), 'MMMM d, yyyy')}
            </div>

            <div className="mb-6">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(foundWords.length / words.length) * 100}%`,
                  }}
                />
              </div>
              <div className="text-sm mt-2">{progress} words found</div>
            </div>

            {!isGameComplete && (
              <form onSubmit={handleGuess} className="mb-4">
                <Input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess..."
                  className="w-full bg-gray-50 border-0 focus:ring-0 focus:border-0 hover:bg-gray-100 transition-colors"
                  disabled={guessMutation.isPending}
                />
              </form>
            )}

            {isGameComplete && (
              <div className="text-center p-4 bg-green-50 text-green-700 rounded-md mb-4">
                Congratulations! You've completed today's game!
              </div>
            )}

            <div className="text-sm text-gray-500 mb-4">
              Total Guesses: {gameState.guesses.length}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">All Guesses:</h3>
              <div className="flex flex-wrap gap-2">
                {gameState.guesses.map((g, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-800"
                  >
                    {g.word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Lyrics Display */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-primary">Title</span>
                <span>{gameState.masked.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">Artist</span>
                <span>{gameState.masked.artist}</span>
              </div>
            </div>

            <div className="leading-loose text-lg">
              {words.map((word, index) => (
                <React.Fragment key={index}>
                  <span className="text-gray-300">{word}</span>
                  {index < words.length - 1 && " "}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 