// Genius API types - consolidated from API types
export interface GeniusArtist {
  id: number;
  name: string;
  url?: string;
  image_url?: string;
  api_path?: string;
  header_image_url?: string;
  is_meme_verified?: boolean;
  is_verified?: boolean;
  iq?: number;
}

export interface GeniusResult {
  id: number;
  title: string;
  url?: string;
  path?: string;
  header_image_thumbnail_url?: string;
  header_image_url?: string;
  primary_artist?: GeniusArtist;
  annotation_count?: number;
  api_path?: string;
  artist_names?: string;
  full_title?: string;
  lyrics_owner_id?: number;
  lyrics_state?: string;
  primary_artist_names?: string;
  pyongs_count?: number | null;
  relationships_index_url?: string;
  release_date_components?: {
    year: number;
    month?: number | null;
    day?: number | null;
  } | null;
  release_date_for_display?: string | null;
  release_date_with_abbreviated_month_for_display?: string | null;
  song_art_image_thumbnail_url?: string;
  song_art_image_url?: string;
  stats?: {
    unreviewed_annotations?: number;
    hot?: boolean;
    pageviews?: number;
    concurrents?: number;
  };
  title_with_featured?: string;
  featured_artists?: unknown[];
  primary_artists?: unknown[];
}

export interface GeniusHit {
  highlights?: unknown[];
  index?: string;
  type?: string;
  result: GeniusResult;
}

export interface GeniusSearchResponse {
  meta: {
    status: number;
  };
  response: {
    hits: GeniusHit[];
  };
}

export interface GeniusData {
  title: string;
  url: string;
  artist: string;
}

export interface GeniusServiceInterface {
  search(query: string): Promise<GeniusSearchResponse>;
  findMatch(title: string, artist: string): Promise<GeniusHit>;
}

export interface GeniusSongResponse {
  title: string;
  primary_artist: {
    name: string;
  };
  album?: {
    name: string;
  };
  release_date?: string;
} 