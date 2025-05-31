import { Track, SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { fixtures } from '../../fixtures';
import { TEST_IDS, getAllTrackIds } from '../../constants';
import { constructSpotifySearchQuery } from '../../../utils/spotify';

// All fixture access is by constant key only. No mapping helpers used.

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
  track: (track: Track, key: string) => {
    const fixture = fixtures.spotify.tracks[key];
    checkTrackFields(track, fixture);
  },

  search: (key: string, results: { tracks?: { items: Track[] }, playlists?: { items: SimplifiedPlaylist[] } }) => {
    if (results.playlists?.items) {
      expect(results.playlists.items.length).toBeGreaterThan(0);
      return;
    }
    if (results.tracks?.items) {
      const expected = fixtures.spotify.tracks[key];
      const found = results.tracks?.items.find(track =>
        track.name.toLowerCase() === expected.name.toLowerCase() &&
        track.artists.some(a => a.name.toLowerCase() === expected.artists[0].name.toLowerCase())
      );
      if (!found) {
        console.error(`Expected track not found by name/artist: ${expected.name} / ${expected.artists[0].name}`);
        console.error('Returned track names:', results.tracks?.items.map(t => t.name));
        console.error('Returned track artists:', results.tracks?.items.map(t => t.artists.map(a => a.name)));
        console.error('Expected search query key:', key);
      }
      expect(found).toBeDefined();
    }
  },

  // Playlist tracks validation is removed because the real Spotify playlist object does not contain track items.
  // If you want to validate playlist tracks, generate and use a separate fixture for playlist tracks.
  // playlist_tracks: (key: string, tracks: { items: { track: Track }[] }) => {
  //   // Not implemented: playlist tracks are not part of the playlist object in the Spotify API.
  // },
}; 