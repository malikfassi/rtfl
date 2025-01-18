import { getSpotifyClient } from '@/lib/clients/spotify';
import { getGeniusClient } from '@/lib/clients/genius';
import { getTrack, searchTracks, getLyrics } from '../song';
import { PARTY_IN_THE_U_S_A_ } from '@/lib/fixtures/songs';
import type { Track, SimplifiedArtist, SimplifiedAlbum } from '@spotify/web-api-ts-sdk';

jest.mock('@/lib/clients/spotify', () => ({
  getSpotifyClient: jest.fn().mockReturnValue({
    getTrack: jest.fn(),
    searchTracks: jest.fn()
  })
}));

jest.mock('@/lib/clients/genius', () => ({
  getGeniusClient: jest.fn().mockReturnValue({
    searchSong: jest.fn()
  })
}));

describe('Song Service', () => {
  const spotifyClient = getSpotifyClient();
  const geniusClient = getGeniusClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArtist: SimplifiedArtist = {
    name: PARTY_IN_THE_U_S_A_.maskedLyrics.artist.join(' '),
    id: 'artist1',
    type: 'artist',
    uri: 'spotify:artist:1',
    external_urls: { spotify: 'https://open.spotify.com/artist/1' },
    href: 'https://api.spotify.com/v1/artists/1'
  };

  const mockAlbum: SimplifiedAlbum = {
    id: 'album1',
    name: 'Test Album',
    type: 'album',
    uri: 'spotify:album:1',
    album_type: 'album',
    album_group: 'album',
    artists: [mockArtist],
    available_markets: ['US'],
    external_urls: { spotify: 'https://open.spotify.com/album/1' },
    href: 'https://api.spotify.com/v1/albums/1',
    images: [],
    release_date: '2024-01-01',
    release_date_precision: 'day',
    total_tracks: 1,
    copyrights: [],
    external_ids: { upc: 'upc123', isrc: 'US-123', ean: 'ean123' },
    genres: [],
    label: 'Test Label',
    popularity: 80,
    restrictions: { reason: 'market' }
  };

  const createMockTrack = (): Track => ({
    id: PARTY_IN_THE_U_S_A_.spotifyId,
    name: PARTY_IN_THE_U_S_A_.maskedLyrics.title.join(' '),
    artists: [mockArtist],
    album: mockAlbum,
    duration_ms: 200000,
    external_ids: { isrc: 'US-123', ean: 'ean123', upc: 'upc123' },
    external_urls: { spotify: 'https://open.spotify.com/track/1' },
    href: 'https://api.spotify.com/v1/tracks/1',
    is_local: false,
    is_playable: true,
    popularity: 80,
    preview_url: 'https://preview.spotify.com/track/1',
    track_number: 1,
    type: 'track',
    uri: 'spotify:track:1',
    available_markets: ['US'],
    disc_number: 1,
    explicit: false,
    restrictions: { reason: 'market' },
    episode: false,
    track: true
  });

  describe('getTrack', () => {
    it('should get track by ID', async () => {
      const mockTrack = createMockTrack();
      jest.spyOn(spotifyClient, 'getTrack').mockResolvedValue(mockTrack);

      const track = await getTrack(PARTY_IN_THE_U_S_A_.spotifyId);
      expect(track).toEqual(mockTrack);
      expect(spotifyClient.getTrack).toHaveBeenCalledWith(PARTY_IN_THE_U_S_A_.spotifyId);
    });
  });

  describe('searchTracks', () => {
    it('should search tracks by query', async () => {
      const mockTracks = [createMockTrack()];
      jest.spyOn(spotifyClient, 'searchTracks').mockResolvedValue(mockTracks);

      const query = `${PARTY_IN_THE_U_S_A_.maskedLyrics.title.join(' ')} ${PARTY_IN_THE_U_S_A_.maskedLyrics.artist.join(' ')}`;
      const tracks = await searchTracks(query);
      expect(tracks).toEqual(mockTracks);
      expect(spotifyClient.searchTracks).toHaveBeenCalledWith(query);
    });
  });

  describe('getLyrics', () => {
    it('should get lyrics by query', async () => {
      jest.spyOn(geniusClient, 'searchSong').mockResolvedValue(PARTY_IN_THE_U_S_A_.lyrics);

      const query = `${PARTY_IN_THE_U_S_A_.maskedLyrics.title.join(' ')} ${PARTY_IN_THE_U_S_A_.maskedLyrics.artist.join(' ')}`;
      const lyrics = await getLyrics(query);
      expect(lyrics).toBe(PARTY_IN_THE_U_S_A_.lyrics);
      expect(geniusClient.searchSong).toHaveBeenCalledWith(query);
    });

    it('should return null when lyrics not found', async () => {
      jest.spyOn(geniusClient, 'searchSong').mockRejectedValue(new Error('Not found'));

      const lyrics = await getLyrics('nonexistent song');
      expect(lyrics).toBeNull();
      expect(geniusClient.searchSong).toHaveBeenCalledWith('nonexistent song');
    });
  });
}); 