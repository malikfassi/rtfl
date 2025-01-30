export interface GeniusData {
  title: string;
  url: string;
  artist: string;
}

export interface GeniusHit {
  result: {
    title: string;
    url: string;
    primary_artist: {
      name: string;
    };
  };
}

export interface GeniusSearchResponse {
  response: {
    hits: GeniusHit[];
  };
}

export interface GeniusServiceInterface {
  search(query: string): Promise<GeniusSearchResponse>;
  findMatch(title: string, artist: string): Promise<GeniusHit>;
} 