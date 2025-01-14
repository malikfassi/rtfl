import axios from 'axios';
import { z } from 'zod';
import { GeniusError } from '../errors';
import { getGeniusApiKey } from './auth';

const ArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const SongSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  path: z.string(),
  artist: ArtistSchema,
  lyrics_state: z.string(),
  primary_artist: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

const SearchResponseSchema = z.object({
  response: z.object({
    hits: z.array(
      z.object({
        result: SongSchema,
      }),
    ),
  }),
});

const SongDetailsSchema = z.object({
  response: z.object({
    song: SongSchema.extend({
      description: z
        .object({
          plain: z.string(),
        })
        .nullable(),
      embed_content: z.string().nullable(),
      recording_location: z.string().nullable(),
      release_date: z.string().nullable(),
    }),
  }),
});

type Song = z.infer<typeof SongSchema>;
type SongDetails = z.infer<typeof SongDetailsSchema>['response']['song'];

export class GeniusClient {
  private baseUrl = 'https://api.genius.com';
  private apiKey: string;

  constructor() {
    this.apiKey = getGeniusApiKey();
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async searchSongs(query: string): Promise<Song[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: this.headers,
        params: {
          q: query,
        },
      });

      const data = SearchResponseSchema.parse(response.data);
      return data.response.hits.map((hit) => hit.result);
    } catch (error) {
      const err = new GeniusError(
        error instanceof Error ? error.message : 'Failed to search songs',
      );
      Object.setPrototypeOf(err, GeniusError.prototype);
      throw err;
    }
  }

  async getSongDetails(songId: number): Promise<SongDetails> {
    try {
      const response = await axios.get(`${this.baseUrl}/songs/${songId}`, {
        headers: this.headers,
      });

      const data = SongDetailsSchema.parse(response.data);
      return data.response.song;
    } catch (error) {
      const err = new GeniusError(
        error instanceof Error ? error.message : 'Failed to get song details',
      );
      Object.setPrototypeOf(err, GeniusError.prototype);
      throw err;
    }
  }

  async getArtistSongs(artistId: number): Promise<Song[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}/songs`, {
        headers: this.headers,
        params: {
          sort: 'popularity',
          per_page: 20,
        },
      });

      const songs = response.data.response.songs.map((song: unknown) => SongSchema.parse(song));
      return songs;
    } catch (error) {
      const err = new GeniusError(
        error instanceof Error ? error.message : 'Failed to get artist songs',
      );
      Object.setPrototypeOf(err, GeniusError.prototype);
      throw err;
    }
  }
}
