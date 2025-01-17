import React from 'react';
import { format } from 'date-fns';
import { SpotifyTrack } from '@/lib/clients/spotify';
import { cn } from '@/lib/utils';

interface PlaylistSongsListProps {
  tracks: SpotifyTrack[];
  songAssignments: Record<string, Date[]>;  // Map of track ID to assigned dates
  onSelect: (track: SpotifyTrack) => void;
  disabled?: boolean;
}

export function PlaylistSongsList({ tracks, songAssignments, onSelect, disabled = false }: PlaylistSongsListProps) {
  // Get assigned dates for a track
  const getAssignedDates = (trackId: string) => {
    const dates = songAssignments[trackId];
    if (!dates || dates.length === 0) return '—';
    
    return dates
      .map(date => format(date, 'MM.dd'))
      .sort()
      .join(', ');
  };

  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      {/* Fixed Header */}
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted border-b border-foreground/10 font-mono flex-shrink-0">
        <div className="w-8">#</div>
        <div className="flex-1">Title</div>
        <div className="w-32">Artist</div>
        <div className="w-32">Date</div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tracks.map((track, index) => {
          const assignedDate = getAssignedDates(track.spotifyId);
          return (
            <button
              key={`${track.spotifyId}-${index}`}
              onClick={() => onSelect(track)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-primary/5",
                "border-b border-foreground/5",
                "transition-colors font-mono",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="w-8 text-muted">{(index + 1).toString().padStart(2, '0')}</div>
              <div className="flex-1 truncate">{track.title}</div>
              <div className="w-32 truncate text-muted">{track.artist}</div>
              <div className="w-32 text-right text-muted">{assignedDate}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 