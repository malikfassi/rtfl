export interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  preview_url?: string;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
} 