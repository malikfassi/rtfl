import { expect } from '@jest/globals';
import type { SongTestCase, PlaylistTestCase } from './test_cases';
import type { GeniusSearchResponse } from '@/types/genius';
import type { Game, Song } from '@prisma/client';
import type { Track } from '@spotify/web-api-ts-sdk';
import type { JsonValue } from '@prisma/client/runtime/library';

export const validators = {
  unit: {
    song: (actual: Record<string, unknown>, testCase: SongTestCase) => {
      const track = testCase.spotify.getTrack();
      const geniusData = testCase.genius.getSearch();
      const maskedLyrics = testCase.lyrics.getMasked();

      // Check Spotify data
      expect(actual.spotifyId).toBe(testCase.id);
      expect(actual.spotifyData).toMatchObject({
        id: track.id,
        name: track.name,
        uri: track.uri,
        artists: track.artists,
        album: track.album
      });

      // Check Genius data (excluding dynamic stats)
      const actualGenius = actual.geniusData as GeniusSearchResponse;
      expect(actualGenius.meta.status).toBe(geniusData.meta.status);
      expect(actualGenius.response.hits[0].result.title).toBe(geniusData.response.hits[0].result.title);
      expect(actualGenius.response.hits[0].result.artist_names).toBe(geniusData.response.hits[0].result.artist_names);
      expect(actualGenius.response.hits[0].result.url).toBe(geniusData.response.hits[0].result.url);

      // Check lyrics and masked lyrics
      expect(actual.lyrics).toBe(testCase.lyrics.get());
      expect(actual.maskedLyrics).toEqual(maskedLyrics);
    },
    playlist: (actual: Record<string, unknown>, testCase: PlaylistTestCase) => {
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: testCase.spotify.getPlaylist(),
        tracks: testCase.spotify.getTracks()
      });
    },
    game: (actual: Record<string, unknown>, testCase: SongTestCase, date: string) => {
      // Validate game structure
      expect(actual).toBeDefined();
      expect(actual.date).toBe(date);
      expect(actual.songId).toBeDefined();

      // Validate associated song
      const song = (actual as { song: Song }).song;
      expect(song).toBeDefined();
      expect(song.spotifyId).toBe(testCase.id);
      
      const track = testCase.spotify.getTrack();
      expect(song.spotifyData as unknown as Track).toMatchObject({
        id: track.id,
        name: track.name,
        uri: track.uri,
        artists: track.artists,
        album: track.album
      });
      
      // Validate Genius data
      const geniusData = song.geniusData as unknown as GeniusSearchResponse;
      const expectedGeniusData = testCase.genius.getSearch();
      expect(geniusData.meta.status).toBe(expectedGeniusData.meta.status);
      expect(geniusData.response.hits[0].result.title).toBe(expectedGeniusData.response.hits[0].result.title);
      expect(geniusData.response.hits[0].result.artist_names).toBe(expectedGeniusData.response.hits[0].result.artist_names);
      expect(geniusData.response.hits[0].result.url).toBe(expectedGeniusData.response.hits[0].result.url);

      // Validate lyrics and masked lyrics
      expect(song.lyrics).toBe(testCase.lyrics.get());
      expect(song.maskedLyrics).toEqual(testCase.lyrics.getMasked());
    }
  },
  integration: {
    song: (actual: Record<string, unknown>, testCase: SongTestCase) => {
      const track = testCase.spotify.getTrack();
      const maskedLyrics = testCase.lyrics.getMasked();
      expect(actual).toMatchObject({
        spotifyId: testCase.id,
        spotifyData: {
          id: track.id,
          uri: track.uri
        },
        lyrics: testCase.lyrics.get(),
        maskedLyrics: {
          title: maskedLyrics.title,
          artist: maskedLyrics.artist,
          lyrics: maskedLyrics.lyrics
        }
      });
    },
    playlist: (actual: Record<string, unknown>, testCase: PlaylistTestCase) => {
      const playlist = testCase.spotify.getPlaylist();
      expect(actual).toMatchObject({
        id: testCase.id,
        spotifyData: {
          id: playlist.id,
          uri: playlist.uri
        }
      });
    },
    game: (actual: Record<string, unknown>, testCase: SongTestCase, date: string) => {
      expect(actual).toBeDefined();
      expect(actual.date).toBe(date);
      
      // Validate essential game properties
      const game = actual as Game & { song: Song };
      expect(game.songId).toBeDefined();
      expect(game.song).toBeDefined();
      
      // Validate essential song properties
      expect(game.song.spotifyId).toBe(testCase.id);
      const track = testCase.spotify.getTrack();
      expect((game.song.spotifyData as JsonValue) as unknown as Track).toMatchObject({
        id: track.id,
        uri: track.uri
      });
      expect(game.song.lyrics).toBe(testCase.lyrics.get());
      expect(game.song.maskedLyrics).toEqual(testCase.lyrics.getMasked());
    }
  }
}; 