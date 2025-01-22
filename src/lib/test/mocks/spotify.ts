import { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { SpotifyError, MissingTrackIdError, MissingSearchQueryError } from '@/lib/errors/spotify';
import { spotifyData } from '@/lib/test/fixtures/spotify';
import { SpotifyClient } from '@/lib/clients/spotify';

export class SpotifyClientMock implements SpotifyClient {
  constructor() {}

  getTrack = jest.fn().mockImplementation(async (id: string): Promise<Track> => {
    if (!id) {
      throw new MissingTrackIdError();
    }
    const track = spotifyData.tracks[id];
    if (!track) {
      throw new SpotifyError('Track not found');
    }
    return track;
  });

  searchTracks = jest.fn().mockImplementation(async (query: string): Promise<Track[]> => {
    if (!query?.trim()) {
      throw new MissingSearchQueryError();
    }
    return Object.values(spotifyData.tracks);
  });

  searchPlaylists = jest.fn().mockImplementation(async (query: string): Promise<SimplifiedPlaylist[]> => {
    if (!query?.trim()) {
      throw new MissingSearchQueryError();
    }
    return [];
  });

  getPlaylistTracks = jest.fn().mockImplementation(async (_playlistId: string): Promise<Track[]> => {
    return [];
  });

  clearMocks() {
    this.getTrack.mockClear();
    this.searchTracks.mockClear();
    this.searchPlaylists.mockClear();
    this.getPlaylistTracks.mockClear();
  }
} 