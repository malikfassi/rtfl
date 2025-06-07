import type { Track } from '@spotify/web-api-ts-sdk';
import React from 'react';

import { cn } from '@/app/front/lib/utils';

interface PlaylistSongsListProps {
  tracks: Track[];
  isLoading?: boolean;
  songAssignments?: Record<string, string[]>; // trackId -> array of dates
}

export function PlaylistSongsList({ tracks, isLoading = false, songAssignments = {} }: PlaylistSongsListProps) {
  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col border border-primary-muted/20 rounded-lg overflow-hidden">
      {/* Fixed Header */}
      <div className="flex items-center gap-3 px-4 py-3 text-xs text-primary-muted border-b border-primary-muted/20 font-mono flex-shrink-0 bg-primary-muted/5">
        <div className="w-8">#</div>
        <div className="flex-1">Title</div>
        <div className="w-32">Artist</div>
        <div className="w-24">Assigned</div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="text-center text-primary-muted py-8">
            <div className="animate-pulse">Loading tracks...</div>
          </div>
        ) : (
          [...tracks]
            .sort((a, b) => {
              const aAssigned = (songAssignments[a.id] || []).length;
              const bAssigned = (songAssignments[b.id] || []).length;
              // Put assigned songs first (descending order)
              return bAssigned - aAssigned;
            })
            .map((track, sortedIndex) => {
            const assignedDates = songAssignments[track.id] || [];
            const originalIndex = tracks.findIndex(t => t.id === track.id);
            return (
              <div
                key={`${track.id}-${sortedIndex}`}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 text-sm transition-all duration-200",
                  "hover:bg-primary-muted/10 focus:bg-primary-muted/15 focus:outline-none",
                  "border-b border-primary-muted/10 last:border-b-0",
                  "font-mono",
                  assignedDates.length > 0 && "bg-accent-success/10"
                )}
              >
                <div className="text-xs text-primary-muted w-8">
                  {originalIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary-dark truncate">
                    {track.name}
                  </div>
                </div>
                <div className="w-32 text-primary-muted truncate">
                  {track.artists[0].name}
                </div>
                <div className="w-24 text-xs">
                  {assignedDates.length > 0 ? (
                    <span className="text-accent-success font-medium">
                      {assignedDates.map(date => {
                        const day = new Date(date).getDate();
                        return day;
                      }).join(', ')}
                    </span>
                  ) : (
                    <span className="text-primary-muted">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 