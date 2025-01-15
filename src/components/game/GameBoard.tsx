import React from 'react';
import type { GameState } from '@/lib/game/state';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { maskedTitle, maskedArtist, maskedLyrics, progress, spotify, genius } = gameState;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress.overall * 100}%` }}
        />
      </div>

      {/* Title and Artist */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-mono">{maskedTitle.maskedText}</h2>
        <p className="text-xl font-mono">{maskedArtist.maskedText}</p>
      </div>

      {/* Lyrics */}
      {maskedLyrics && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <pre className="whitespace-pre-wrap font-mono text-lg">
            {maskedLyrics.maskedText}
          </pre>
        </div>
      )}

      {/* Spotify Preview */}
      {spotify && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="text-xl font-bold mb-2">🎵 {spotify.songTitle}</h3>
          <p className="text-lg mb-4">by {spotify.artistName}</p>
          {spotify.albumCover && (
            <img 
              src={spotify.albumCover} 
              alt="Album Cover" 
              className="w-32 h-32 object-cover rounded-lg mx-auto"
            />
          )}
          {spotify.previewUrl && (
            <audio 
              controls 
              className="w-full mt-4"
              src={spotify.previewUrl}
            >
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      )}

      {/* Genius Lyrics */}
      {genius && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-xl font-bold mb-2">📝 Full Lyrics</h3>
          <pre className="whitespace-pre-wrap">
            {genius.lyrics}
          </pre>
        </div>
      )}

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-4 text-center mt-4">
        <div>
          <p className="text-sm text-gray-600">Title/Artist Progress</p>
          <p className="text-lg font-bold">{Math.round(progress.titleArtist * 100)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Lyrics Progress</p>
          <p className="text-lg font-bold">{Math.round(progress.lyrics * 100)}%</p>
        </div>
      </div>
    </div>
  );
} 