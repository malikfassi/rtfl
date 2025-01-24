import type { Track } from '@spotify/web-api-ts-sdk';
import React from 'react';

import { cn } from '@/app/front/lib/utils';

interface PlaylistSongsListProps {
  tracks: Track[];
  isLoading?: boolean;
}

export function PlaylistSongsList({ tracks, isLoading = false }: PlaylistSongsListProps) {
  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      {/* Fixed Header */}
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted border-b border-foreground/10 font-mono flex-shrink-0">
        <div className="w-8">#</div>
        <div className="flex-1">Title</div>
        <div className="w-32">Artist</div>
        <div className="w-32">ID</div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted">Loading tracks...</div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1 text-xs",
                "border-b border-foreground/5",
                "transition-colors font-mono"
              )}
            >
              <div className="w-8">{index + 1}</div>
              <div className="flex-1 truncate">{track.name}</div>
              <div className="w-32 truncate">{track.artists[0].name}</div>
              <div className="w-32 truncate text-muted">{track.id}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 