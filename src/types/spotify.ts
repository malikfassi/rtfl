export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
} 