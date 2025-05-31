// External imports
// External type imports
import type { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { NextResponse } from 'next/server';

// Internal imports
import { getSpotifyClient } from '@/app/api/lib/clients/spotify';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { schemas, validateSearchParam } from '@/app/api/lib/validation';

// These types are used for type checking the response
type ErrorResponse = { error: string };
type SuccessResponse = { playlists: SimplifiedPlaylist[] };
type Response = ErrorResponse | SuccessResponse;

export async function GET(request: Request): Promise<NextResponse<Response>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = validateSearchParam(searchParams, 'q', schemas.searchQuery);
    
    const client = await getSpotifyClient();
    const playlistsPage = await client.searchPlaylists(query);
    return NextResponse.json({ playlists: playlistsPage.items });
  } catch (error) {
    return handleError(error);
  }
}