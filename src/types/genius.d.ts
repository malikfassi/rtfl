export interface GeniusSearchResponse {
  response: {
    hits: Array<{
      result: {
        id: number;
        title: string;
        primary_artist: {
          id: number;
          name: string;
        };
        url: string;
      };
    }>;
  };
}

export interface GeniusLyrics {
  lyrics: string;
  geniusId: string;
  spotifyId: string;
  updatedAt: string;
}

export interface GeniusSong {
  id: number;
  title: string;
  url: string;
  path: string;
  primary_artist: {
    id: number;
    name: string;
    url: string;
  };
  lyrics_state: string;
  lyrics_owner_id: number;
  song_art_image_url: string;
}
