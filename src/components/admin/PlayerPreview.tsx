'use client';

import { useState } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  previewUrl: string | null;
  maskedLyrics: {
    title: string[];
    artist: string[];
    lyrics: string[];
  };
}

interface PlayerPreviewProps {
  song: Song;
}

export function PlayerPreview({ song }: PlayerPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!audioElement && song.previewUrl) {
      const audio = new Audio(song.previewUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Player Preview</h2>

      {/* Audio Player */}
      {song.previewUrl && (
        <div className="mb-6">
          <button
            onClick={handlePlayPause}
            className={`
              w-full py-3 px-4 rounded-lg flex items-center justify-center
              ${isPlaying
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
              } hover:bg-opacity-80 transition-colors
            `}
          >
            <span className="text-2xl mr-2">
              {isPlaying ? '⏸' : '▶️'}
            </span>
            {isPlaying ? 'Pause Preview' : 'Play Preview'}
          </button>
        </div>
      )}

      {/* Masked Title */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
        <div className="flex flex-wrap gap-2">
          {song.maskedLyrics.title.map((word, index) => (
            <div
              key={`title-${index}`}
              className="px-3 py-1 bg-gray-100 rounded text-gray-700 font-mono"
            >
              {word}
            </div>
          ))}
        </div>
      </div>

      {/* Masked Artist */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Artist</h3>
        <div className="flex flex-wrap gap-2">
          {song.maskedLyrics.artist.map((word, index) => (
            <div
              key={`artist-${index}`}
              className="px-3 py-1 bg-gray-100 rounded text-gray-700 font-mono"
            >
              {word}
            </div>
          ))}
        </div>
      </div>

      {/* Masked Lyrics */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Lyrics</h3>
        <div className="space-y-2">
          {song.maskedLyrics.lyrics.map((word, index) => (
            <div
              key={`lyrics-${index}`}
              className="px-3 py-1 bg-gray-100 rounded text-gray-700 font-mono inline-block mr-2 mb-2"
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 