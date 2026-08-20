// External imports
// External type imports
import type { Track } from '@spotify/web-api-ts-sdk';
import { NextResponse } from 'next/server';

// Internal imports
import { getSpotifyClient, type SpotifyClient } from '@/app/api/lib/clients/spotify';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { spotifyIdSchema, validateSchema } from '@/app/api/lib/validation';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = { tracks: Track[] };
type Response = ErrorResponse | SuccessResponse;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<Response>> {
  try {
    const { id } = await params;
    const validatedId = validateSchema(spotifyIdSchema, id);
    return Promise.resolve(getSpotifyClient())
      .then((client: SpotifyClient) => client.getPlaylistTracks(validatedId))
      // Same as the playlist search: a playlist can hold entries Spotify
      // returns as null, and local files that carry no id and so can never be
      // scheduled. Neither belongs in a Track[].
      .then((tracks: Track[]) =>
        NextResponse.json({ tracks: tracks.filter(track => !!track && !!track.id) }),
      )
      .catch((error: unknown) => handleError(error));
  } catch (error) {
    return handleError(error);
  }
}