import type { Track } from "@spotify/web-api-ts-sdk";
import type { GameWithSong, MaskedLyrics, Token } from "@/app/types";
import { getTrackArtist, getTrackTitle } from "@/app/front/lib/helpers/spotify";
import type { DayStatus } from "./StatusPill";

/**
 * A single day in the scheduling queue: the date, whatever game is on it, and
 * the few things the rail needs to render a row.
 */
export interface QueueDay {
  date: string;
  game: GameWithSong | null;
  status: DayStatus;
  title: string;
  artist: string;
  /** Guessable words in the lyrics, or null when nothing is scheduled. */
  words: number | null;
}

/** Song.spotifyData is stored as raw JSON, so it arrives untyped. */
function asTrack(spotifyData: unknown): Track | null {
  if (!spotifyData || typeof spotifyData !== "object") return null;
  return spotifyData as Track;
}

function asMaskedLyrics(maskedLyrics: unknown): MaskedLyrics | null {
  if (!maskedLyrics || typeof maskedLyrics !== "object") return null;
  return maskedLyrics as MaskedLyrics;
}

function countGuessableWords(game: GameWithSong): number {
  const masked = asMaskedLyrics(game.song?.maskedLyrics);
  const lyrics: Token[] = Array.isArray(masked?.lyrics) ? masked.lyrics : [];
  return lyrics.filter(token => token.isToGuess).length;
}

export function buildQueueDay(date: string, game: GameWithSong | null): QueueDay {
  if (!game?.song) {
    return { date, game: null, status: "empty", title: "", artist: "", words: null };
  }

  const track = asTrack(game.song.spotifyData);
  const words = countGuessableWords(game);

  return {
    date,
    game,
    // A song with nothing to guess is scheduled but unplayable - the scraper
    // found the track and no usable lyrics. That is a different problem from
    // an unfilled day, and the spec gives it its own pill.
    status: words > 0 ? "scheduled" : "needs lyrics",
    // The helpers return '' rather than null, so fall back on falsiness.
    title: getTrackTitle(track) || "Unknown title",
    artist: getTrackArtist(track) || "Unknown artist",
    words,
  };
}

/** `Artist · 2019 · 3:48`, the metadata line the spec asks for on a result row. */
export function formatTrackMeta(track: Track): string {
  const artist = getTrackArtist(track);
  const year = track.album?.release_date?.slice(0, 4);
  const duration = track.duration_ms ? formatDuration(track.duration_ms) : undefined;
  return [artist, year, duration].filter(Boolean).join(" · ");
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function trackThumbnail(track: Track): string | null {
  const images = track.album?.images ?? [];
  if (!images.length) return null;
  // Smallest image that exists - these render at 38px.
  return images[images.length - 1]?.url ?? null;
}
