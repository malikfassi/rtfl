import React, { useState } from 'react';
import { AdminGame } from '@/types/admin';
import { Button } from '@/components/ui/Button';

interface GamePreviewProps {
  game: AdminGame;
}

export function GamePreview({ game }: GamePreviewProps) {
  const [isMasked, setIsMasked] = useState(true);
  const { song } = game;
  const { maskedLyrics } = song;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
        <h2 className="font-mono">
          <span className="opacity-50">{'>'} </span>
          Preview
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsMasked(!isMasked)}
          prefix={isMasked ? '👁' : '🙈'}
        >
          {isMasked ? 'Show Answer' : 'Hide Answer'}
        </Button>
      </div>
      
      <div className="flex flex-col gap-8 p-6">
        {/* Song Info */}
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm opacity-50">Song Info</h3>
          <div className="flex flex-col gap-1 font-mono">
            <p>
              <span className="opacity-50">Title: </span>
              {isMasked 
                ? maskedLyrics?.title.map((char) => char || '_').join(' ')
                : song.title}
            </p>
            <p>
              <span className="opacity-50">Artist: </span>
              {isMasked
                ? maskedLyrics?.artist.map((char) => char || '_').join(' ')
                : song.artist}
            </p>
          </div>
        </div>

        {/* Lyrics Preview */}
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm opacity-50">Lyrics Preview</h3>
          <div className="font-mono">
            {isMasked
              ? maskedLyrics?.lyrics.map((line, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {line || '...'}
                  </p>
                ))
              : song.lyrics?.split('\n').map((line, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {line || '...'}
                  </p>
                ))}
          </div>
        </div>

        {/* Audio Preview */}
        {song.previewUrl && (
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-sm opacity-50">Audio Preview</h3>
            <audio
              src={song.previewUrl}
              controls
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
} 