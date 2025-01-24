"use client";

import type { Track } from '@spotify/web-api-ts-sdk';
import React, { useState } from 'react';

import { Button } from '@/app/front/components/ui/Button';
import { formatDate } from '@/app/front/lib/utils/date';
import { getTrackArtist,getTrackTitle } from '@/app/front/lib/utils/spotify';
import { type AdminGame } from '@/app/types/admin';

interface GamePreviewProps {
  game: AdminGame;
  date: Date;
  onSearchClick: () => void;
  isUpdating?: boolean;
}

interface MaskedLyrics {
  title: string;
  artist: string;
  lyrics: string;
}

interface MaskedLyricsData {
  title: unknown;
  artist: unknown;
  lyrics: unknown;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMaskedLyrics(game: AdminGame): MaskedLyrics {
  const defaultLyrics = { title: '', artist: '', lyrics: '' };
  
  if (!game.song.maskedLyrics || !isJsonObject(game.song.maskedLyrics)) {
    return defaultLyrics;
  }

  const data = game.song.maskedLyrics as unknown as MaskedLyricsData;
  
  return {
    title: String(data.title || ''),
    artist: String(data.artist || ''),
    lyrics: String(data.lyrics || '')
  };
}

export function GamePreview({ game, date, onSearchClick, isUpdating = false }: GamePreviewProps) {
  const [showMasked, setShowMasked] = useState(false);
  const maskedLyrics = getMaskedLyrics(game);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm text-gray-500">
            {formatDate(date)}
          </span>
          <h2 className="text-xl font-semibold">
            {showMasked ? maskedLyrics.title : getTrackTitle(game.song.spotifyData as unknown as Track)}
          </h2>
          <span className="text-gray-600">
            {showMasked ? maskedLyrics.artist : getTrackArtist(game.song.spotifyData as unknown as Track)}
          </span>
        </div>
        <div className="flex gap-2">
          {game && (
            <Button
              variant="secondary"
              onClick={() => setShowMasked(!showMasked)}
            >
              {showMasked ? 'Show Original' : 'Show Masked'}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onSearchClick}
            disabled={isUpdating}
          >
            {game ? 'Change Song' : 'Add Song'}
          </Button>
        </div>
      </div>
      {game && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Lyrics</span>
            <p className="whitespace-pre-wrap">
              {showMasked ? maskedLyrics.lyrics : game.song.lyrics}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 