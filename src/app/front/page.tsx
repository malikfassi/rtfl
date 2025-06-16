"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import { useGameMonth } from "@/app/front/hooks/usePlayer";
import { getOrCreatePlayerId } from "@/app/front/lib/utils";
import { LoadingSpinner } from "@/app/front/components/ui/LoadingSpinner";
import { ErrorState } from "@/app/front/components/ui/ErrorState";
import { EmptyState } from "@/app/front/components/ui/EmptyState";
import type { GameState } from "@/app/api/lib/types/game-state";
import { buildGameRoute, getCurrentMonth } from "@/app/front/lib/routes";

function formatMaskedText(tokens: Array<{ value: string; isToGuess: boolean }>): string {
  return tokens.map(token => token.value).join('');
}

export default function HomePage() {
  const router = useRouter();
  const playerId = getOrCreatePlayerId();
  const currentMonth = getCurrentMonth();
  
  const { data: games, isLoading, error } = useGameMonth(playerId, currentMonth);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center min-h-[50vh]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <ErrorState 
            title="Error Loading Games"
            message={error instanceof Error ? error.message : 'An error occurred while loading games'}
            onRetry={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  if (!games?.length) {
    return (
      <div className="min-h-screen bg-background p-8 font-mono">
        <div className="max-w-2xl mx-auto">
          <EmptyState 
            title="No Games Available"
            message="There are no games available for this month. Check back later!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 font-mono">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Games for {format(new Date(currentMonth), 'MMMM yyyy')}</h1>
        <div className="grid gap-4">
          {games.map((game: GameState) => (
            <div 
                key={game.date}
              className="p-4 rounded-lg bg-primary-muted/5 hover:bg-primary-muted/10 cursor-pointer transition-colors"
              onClick={() => router.push(buildGameRoute(game.date))}
              >
              <h2 className="text-lg font-semibold">{formatMaskedText(game.masked.title)}</h2>
              <p className="text-primary-muted">{formatMaskedText(game.masked.artist)}</p>
              {game.song && (
                <div className="mt-2 text-sm text-primary-muted">
                  <span className="font-medium">Progress:</span> {game.guesses.length} guesses
                    </div>
                  )}
                </div>
          ))}
        </div>
      </div>
    </div>
  );
} 