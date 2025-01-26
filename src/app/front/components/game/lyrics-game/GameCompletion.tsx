"use client";

import React, { useState } from "react";
import { cn } from "@/app/front/lib/utils";
import type { Song } from "@prisma/client";

interface GameCompletionProps {
  song: Song;
  foundWords: string[];
}

export function GameCompletion({ song, foundWords }: GameCompletionProps) {
  const [showFullLyrics, setShowFullLyrics] = useState(false);

  // Function to highlight found words in the lyrics
  const highlightLyrics = () => {
    return song.lyrics.split("\n").map((line, lineIndex) => (
      <div key={lineIndex} className="mb-2">
        {line.split(" ").map((word, wordIndex) => {
          const isFound = foundWords.includes(word.toLowerCase());
          return (
            <span
              key={`${lineIndex}-${wordIndex}`}
              className={cn(
                "transition-all duration-500",
                isFound 
                  ? "text-primary hover:text-accent-mint hover:-translate-y-0.5" 
                  : showFullLyrics 
                    ? "text-primary-muted" 
                    : "text-primary/0",
                "inline-block"
              )}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Spotify Player */}
      {song.spotifyId && (
        <div className="rounded-lg overflow-hidden bg-white/5">
          <iframe
            src={`https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0"
          />
        </div>
      )}

      {/* Reveal Lyrics Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowFullLyrics(prev => !prev)}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-primary-muted"
        >
          {showFullLyrics ? "Hide" : "Reveal"} Full Lyrics
        </button>
      </div>

      {/* Lyrics Display */}
      <div className="font-mono text-sm leading-relaxed">
        {highlightLyrics()}
      </div>
    </div>
  );
} 