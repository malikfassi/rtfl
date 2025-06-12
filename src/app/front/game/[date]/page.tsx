"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { LyricsGame } from "@/app/front/components/game/LyricsGame";
import { getOrCreatePlayerId } from '@/app/front/lib/utils';

export default function GamePage() {
  const params = useParams();
  const date = params.date as string;

  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState<any>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isUsingRickroll, setIsUsingRickroll] = useState(false);

  React.useEffect(() => {
    const fetchGame = async () => {
      setIsLoading(true);
      setError(null);
      setIsUsingRickroll(false);
      try {
        const response = await fetch(`/api/games/${date}`, {
          headers: {
            'x-user-id': getOrCreatePlayerId()
          }
        });
        
        if (!response.ok) {
          if (response.status === 400 || response.status === 403 || response.status === 404) {
            // Invalid date format, future date, or non-existent game - load rickroll game
            setIsUsingRickroll(true);
            const rickrollResponse = await fetch('/api/games/rickroll', {
              headers: {
                'x-user-id': getOrCreatePlayerId()
              }
            });
            if (!rickrollResponse.ok) {
              throw new Error('Failed to load rickroll game');
            }
            const rickrollData = await rickrollResponse.json();
            setGame(rickrollData);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to load game: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          setGame(data);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        setGame(undefined);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGame();
  }, [date]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-accent-error">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame
          date={date}
          game={game}
          rickrollMode={isUsingRickroll}
        />
      </div>
    </div>
  );
} 