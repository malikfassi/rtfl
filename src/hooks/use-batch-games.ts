import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminGame, SpotifyTrack } from '@/types/admin';
import { format } from 'date-fns';

interface BatchGameAssignment {
  date: Date;
  track: SpotifyTrack;
}

export interface BatchGameError {
  date: Date;
  error: Error;
}

interface BatchGameCreationParams {
  dates: Date[];
  tracks: SpotifyTrack[];
  onProgress?: (date: Date, result?: AdminGame, error?: BatchGameError) => void;
  maxRetries?: number;
  retryDelay?: number;
}

const adminApi = {
  createOrUpdateGame: async (date: string, spotifyId: string): Promise<AdminGame> => {
    const res = await fetch(`/api/admin/games/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId })
    });
    if (!res.ok) throw new Error('Failed to create/update game');
    return res.json();
  }
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function assignRandomSongs(dates: Date[], tracks: SpotifyTrack[]): BatchGameAssignment[] {
  // Shuffle both arrays to ensure random assignment
  const shuffledDates = shuffleArray(dates);
  const shuffledTracks = shuffleArray(tracks);
  
  // Use the minimum length to avoid out of bounds
  const count = Math.min(dates.length, tracks.length);
  
  return shuffledDates
    .slice(0, count)
    .map((date, index) => ({
      date,
      track: shuffledTracks[index]
    }));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay: number,
  currentAttempt = 1
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (currentAttempt >= maxRetries) {
      throw error;
    }

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, currentAttempt - 1) * (0.5 + Math.random() * 0.5);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(operation, maxRetries, baseDelay, currentAttempt + 1);
  }
}

export function useBatchGameCreation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dates, 
      tracks, 
      onProgress,
      maxRetries = 3,
      retryDelay = 1000
    }: BatchGameCreationParams) => {
      const assignments = assignRandomSongs(dates, tracks);
      const results: AdminGame[] = [];
      const errors: BatchGameError[] = [];
      const failedAssignments = new Map<string, BatchGameAssignment>();

      // Process each assignment sequentially
      for (const assignment of assignments) {
        const { date, track } = assignment;
        const formattedDate = format(date, 'yyyy-MM-dd');

        try {
          // Report progress before starting
          onProgress?.(date);

          // Create the game with retry
          const game = await retryWithBackoff(
            () => adminApi.createOrUpdateGame(formattedDate, track.id),
            maxRetries,
            retryDelay
          );
          
          // Add to results and report progress
          results.push(game);
          onProgress?.(date, game);

          // Add a small delay between operations
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Add to errors and report progress
          const batchError: BatchGameError = {
            date,
            error: error as Error
          };
          errors.push(batchError);
          failedAssignments.set(formattedDate, assignment);
          onProgress?.(date, undefined, batchError);
        }
      }

      return {
        results,
        errors,
        assignments,
        failedAssignments: Array.from(failedAssignments.values())
      };
    },
    onSuccess: (data) => {
      // Invalidate affected months to trigger refetch
      const months = new Set(data.results.map(game => game.date.substring(0, 7)));
      months.forEach(month => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.games.byMonth(month)
        });
      });
    }
  });
}

export function usePreviewBatchAssignments(dates: Date[], tracks: SpotifyTrack[]) {
  return assignRandomSongs(dates, tracks);
} 