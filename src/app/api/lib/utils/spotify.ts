import type { Track } from '@spotify/web-api-ts-sdk';
import type { SpotifyData } from '@/app/api/lib/types/spotify';

/**
 * Constructs a search query for Spotify
 */
export function constructSpotifySearchQuery(title: string, artist?: string): string {
  const cleanText = (text: string) => text.toLowerCase().trim();
  const cleanTitle = cleanText(title);
  return artist ? `${cleanTitle} ${cleanText(artist)}` : cleanTitle;
}

/**
 * Extracts essential data from a Spotify track response
 * to store in the database
 */
export function extractTrackData(track: Track): SpotifyData {
  return {
    name: track.name,
    artists: track.artists.map(a => ({ 
      name: a.name, 
      id: a.id 
    })),
    album: {
      name: track.album.name,
      images: track.album.images
    },
    preview_url: track.preview_url
  };
} 