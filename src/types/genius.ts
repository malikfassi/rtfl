export interface GeniusSearchResponse {
  meta: {
    status: number;
  };
  response: {
    hits: Array<{
      highlights?: unknown[];
      index?: string;
      type?: string;
      result: {
        id: number;
        title: string;
        url: string;
        path: string;
        header_image_thumbnail_url: string;
        header_image_url: string;
        primary_artist: {
          id: number;
          name: string;
          url: string;
          image_url: string;
          api_path?: string;
        };
        annotation_count?: number;
        api_path?: string;
        artist_names?: string;
        full_title?: string;
        lyrics_owner_id?: number;
        lyrics_state?: string;
        primary_artist_names?: string;
        pyongs_count?: number;
        relationships_index_url?: string;
        release_date_components?: {
          year: number;
          month: number;
          day: number;
        };
        release_date_for_display?: string;
        release_date_with_abbreviated_month_for_display?: string;
        song_art_image_thumbnail_url?: string;
        song_art_image_url?: string;
        stats?: {
          unreviewed_annotations: number;
          hot: boolean;
          pageviews: number;
        };
        title_with_featured?: string;
        featured_artists?: unknown[];
      };
    }>;
  };
} 