import { GeniusData, GeniusHit } from '@/app/types';

/**
 * Extracts clean GeniusData from a GeniusHit.
 */
export function extractGeniusData(hit: GeniusHit): GeniusData {
  return {
    title: hit.result.title,
    url: hit.result.url ?? '',
    artist: hit.result.primary_artist?.name ?? ''
  };
}