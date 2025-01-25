"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useGameMonth } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const playerId = getOrCreatePlayerId();
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const { data: games, isLoading, error } = useGameMonth(playerId, currentMonth);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center min-h-[50vh]">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center min-h-[50vh] text-red-500">
            {error instanceof Error ? error.message : 'An error occurred'}
          </div>
        </div>
      </div>
    );
  }

  if (!games?.length) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center min-h-[50vh]">
            No games available for this month
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 font-mono">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            Available Games
          </h1>
          <div className="text-sm text-gray-500">
            {format(new Date(), 'MMMM yyyy')}
          </div>
        </div>

        <div className="grid gap-4">
          {games.map((game) => {
            const totalWords = game.masked.lyrics.split(" ").length;
            const foundWords = game.guesses.length;
            const progress = (foundWords / totalWords) * 100;
            const isComplete = progress === 100;

            return (
              <button
                key={game.date}
                onClick={() => router.push(`/game/${game.date}`)}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-medium">
                    {format(new Date(game.date), 'MMMM d, yyyy')}
                  </div>
                  {isComplete && (
                    <div className="text-sm text-green-600 font-medium">
                      Completed
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    {game.masked.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {game.masked.artist}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm mt-2 text-gray-500">
                    {foundWords}/{totalWords} words found
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 