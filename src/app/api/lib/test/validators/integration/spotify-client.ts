import { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';
import { TEST_IDS } from '../../constants';
import { constructSpotifySearchQuery } from '../../../utils/spotify';

const checkAlbumFields = (actual: Track['album'], expected: Track['album']) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.artists).toEqual(expected.artists);
  expect(actual.images).toEqual(expected.images);
  expect(actual.release_date).toBe(expected.release_date);
  expect(actual.uri).toBe(expected.uri);
};

const checkTrackFields = (actual: Track, expected: Track) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.artists).toEqual(expected.artists);
  checkAlbumFields(actual.album, expected.album);
  expect(actual.duration_ms).toBe(expected.duration_ms);
  expect(actual.preview_url).toBe(expected.preview_url);
  expect(actual.uri).toBe(expected.uri);
};

export const spotifyValidator = {
  track: (track: Track) => {
    const fixture = fixtures.spotify.getTrack.get(track.uri);
    checkTrackFields(track, fixture);
  },

  search: (query: string, results: { tracks?: { items: Track[] }, playlists?: { items: SimplifiedPlaylist[] } }) => {
    // If we have playlist results, check playlist fixtures first
    if (results.playlists?.items) {
      // For known playlist queries, validate against fixtures
      for (const [key, uri] of Object.entries(TEST_IDS.SPOTIFY.PLAYLISTS)) {
        const fixture = fixtures.spotify.getPlaylist.get(uri);
        if (query === fixture.name && results.playlists.items[0]) {
          const playlist = results.playlists.items[0];
          // For playlists, we only validate the name since that's what we search by
          expect(playlist.name).toBe(fixture.name);
          // Validate basic playlist structure
          expect(playlist.id).toBeDefined();
          expect(playlist.uri).toBeDefined();
          expect(playlist.type).toBe('playlist');
          return;
        }
      }

      // If no fixture match, validate structure
      results.playlists.items.forEach(playlist => {
        expect(playlist.id).toBeDefined();
        expect(playlist.name).toBeDefined();
        expect(playlist.uri).toBeDefined();
        expect(playlist.type).toBe('playlist');
      });
      return;
    }

    // For track searches
    if (results.tracks?.items) {
      // For known track queries, validate against fixtures
      for (const [key, uri] of Object.entries(TEST_IDS.SPOTIFY.TRACKS)) {
        const fixture = fixtures.spotify.getTrack.get(uri);
        const expectedQuery = constructSpotifySearchQuery(fixture.name, fixture.artists[0].name);
        
        if (query === expectedQuery && results.tracks.items[0]) {
          checkTrackFields(results.tracks.items[0], fixture);
          return;
        }
      }

      // If no fixture match, validate structure
      results.tracks.items.forEach(track => {
        expect(track.id).toBeDefined();
        expect(track.name).toBeDefined();
        expect(track.artists).toBeDefined();
        expect(track.album).toBeDefined();
      });
    }
  },

  playlist_tracks: (playlistId: string, tracks: { items: { track: Track }[] }) => {
    const fixture = fixtures.spotify.getPlaylist.get(playlistId);
    expect(tracks.items.length).toBe(fixture.tracks.items.length);
    tracks.items.forEach((item, index) => {
      checkTrackFields(item.track, fixture.tracks.items[index].track);
    });
  }
}; 