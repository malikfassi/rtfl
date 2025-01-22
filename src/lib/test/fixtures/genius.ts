import type { GeniusSearchResponse } from '@/types/genius';
import geniusJson from './json/genius.json';

interface GeniusSongData extends GeniusSearchResponse {
  title: string;
  artist_names: string;
  lyrics?: string;
}

type GeniusData = {
  search: Record<string, GeniusSongData>;
  lyrics: Record<string, string>;
};

export const geniusData = geniusJson as unknown as GeniusData;