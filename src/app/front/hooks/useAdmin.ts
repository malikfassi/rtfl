import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { GameWithSong } from '@/app/types';
import { queryKeys } from '@/app/front/lib/query-client';

type ErrorBody = { message?: string; error?: string };

/**
 * Reads a body without assuming it is JSON. A dev server that is killed or is
 * recompiling answers mid-request with an empty body, and `response.json()`
 * reports that as "Unexpected end of JSON input" - a message that names neither
 * the request that failed nor the reason.
 */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * `action` is folded into the failure message, so a batch that stops partway
 * says which day it stopped on rather than just that something went wrong.
 */
async function request<T>(url: string, action: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await readBody(response);

  if (!response.ok) {
    const { message, error } = (body ?? {}) as ErrorBody;
    throw new Error(
      message || error || `${action} failed (${response.status} ${response.statusText})`,
    );
  }
  if (body === null) {
    throw new Error(`${action} failed: the server closed the connection without replying`);
  }
  return body as T;
}

const adminApi = {
  getGamesByMonth: (month: string): Promise<GameWithSong[]> =>
    request(`/api/admin/games?month=${month}`, 'Loading the month'),

  createOrUpdateGame: ({ date, spotifyId }: { date: string; spotifyId: string }): Promise<GameWithSong> =>
    request(`/api/admin/games/${date}`, `Scheduling ${date}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyId }),
    }),

  deleteGame: (date: string): Promise<void> =>
    request<{ success: boolean }>(`/api/admin/games/${date}`, `Removing ${date}`, {
      method: 'DELETE',
    }).then(() => undefined),
};

export function useAdminGames(date?: Date) {
  const month = date ? format(date, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
  return useQuery({
    queryKey: queryKeys.games.byMonth(month),
    queryFn: () => adminApi.getGamesByMonth(month),
  });
}

export function useAdminGameMutations() {
  const queryClient = useQueryClient();

  const createGame = useMutation({
    mutationFn: adminApi.createOrUpdateGame,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(data.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(data.date.slice(0, 7)) });
    },
  });

  const deleteGame = useMutation({
    mutationFn: adminApi.deleteGame,
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byMonth(date.slice(0, 7)) });
    },
  });

  return { createGame, deleteGame };
} 