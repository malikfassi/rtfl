"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { cn } from "@/app/front/lib/utils";
import { useDebounce } from "@/app/front/hooks/useDebounce";
import { usePlaylists, usePlaylistTracks } from "@/app/front/hooks/use-playlists";
import { TrackRow } from "./TrackRow";
import type { QueueDay } from "./day-model";

type Source = "search" | "playlist";

interface AssignPanelProps {
  selectedDays: QueueDay[];
  onSchedule: (spotifyId: string, dates: string[]) => Promise<void>;
  onScheduleMany: (tracks: Track[], dates: string[]) => Promise<void>;
  onRemove: (dates: string[]) => Promise<void>;
  busy: string | null;
}

async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`/api/admin/spotify/tracks/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || error.error || "Failed to search tracks");
  }
  const data = await res.json();
  return data.tracks ?? [];
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-rtfl-ink-2">
      {children}
    </span>
  );
}

export function AssignPanel({
  selectedDays,
  onSchedule,
  onScheduleMany,
  onRemove,
  busy,
}: AssignPanelProps) {
  const [source, setSource] = useState<Source>("search");
  const [query, setQuery] = useState("");
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [playlist, setPlaylist] = useState<SimplifiedPlaylist | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const debouncedPlaylistQuery = useDebounce(playlistQuery, 300);

  const dates = useMemo(() => selectedDays.map(d => d.date), [selectedDays]);
  const single = selectedDays.length === 1 ? selectedDays[0] : null;

  const {
    data: tracks = [],
    isFetching: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["admin", "tracks", "search", debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: source === "search" && debouncedQuery.trim().length > 0,
  });

  const { data: playlists = [], isFetching: isLoadingPlaylists } = usePlaylists(
    debouncedPlaylistQuery,
    source === "playlist" && !playlist,
  );
  const { data: playlistTracks = [], isFetching: isLoadingTracks } = usePlaylistTracks(
    source === "playlist" ? playlist?.id ?? null : null,
  );

  const label =
    selectedDays.length === 0
      ? "Pick a day from the queue"
      : selectedDays.length === 1
        ? `Assign a song to ${dates[0]}`
        : `Assign songs to ${selectedDays.length} days`;

  const nothingSelected = selectedDays.length === 0;

  return (
    <div className="flex min-h-0 flex-col gap-[18px] overflow-y-auto p-[22px_26px_28px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MicroLabel>{label}</MicroLabel>
        <div className="flex gap-[6px]">
          {(["search", "playlist"] as Source[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={cn(
                "rounded-[7px] border p-[5px_11px] font-sans text-[11.5px] transition-colors duration-150",
                source === s
                  ? "border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink"
                  : "border-rtfl-line-soft text-rtfl-ink-2 hover:text-rtfl-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* A day that already has a song gets its current assignment surfaced
          first, with the Remove the spec left as a follow-up state. */}
      {single?.game && (
        <div className="flex flex-col gap-[10px]">
          <MicroLabel>currently scheduled</MicroLabel>
          <div className="flex items-center gap-[14px] rounded-[9px] border border-rtfl-line-soft bg-rtfl-surface p-[12px_14px]">
            <span className="h-[38px] w-[38px] shrink-0 rounded-[5px] bg-rtfl-raised" />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate font-sans text-[14px] text-rtfl-ink">{single.title}</span>
              <span className="truncate font-sans text-[11.5px] text-rtfl-ink-3">
                {single.artist}
                {single.words !== null && ` · ${single.words} words`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(dates)}
              disabled={busy !== null}
              className={cn(
                "shrink-0 rounded-[8px] border border-rtfl-error/40 bg-rtfl-error/10 p-[8px_14px] font-sans text-[12px] text-rtfl-error transition-colors duration-150 hover:bg-rtfl-error/20",
                busy !== null && "cursor-not-allowed opacity-50",
              )}
            >
              {busy === `remove:${dates[0]}` ? "…" : "Remove"}
            </button>
          </div>
        </div>
      )}

      {source === "search" ? (
        <>
          <label className="flex items-center gap-[10px] rounded-[10px] border border-rtfl-line bg-rtfl-bg p-[0_14px]">
            <span className="text-[13px] text-rtfl-ink-3">⌕</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search Spotify for a song…"
              aria-label="Search for a song"
              disabled={nothingSelected}
              className="w-full bg-transparent py-[11px] font-mono text-[13px] text-rtfl-ink placeholder:text-rtfl-ink-3 focus:outline-none disabled:cursor-not-allowed"
            />
          </label>

          {searchError ? (
            <p className="m-0 font-sans text-[13px] text-rtfl-error">
              {searchError instanceof Error ? searchError.message : "Search failed"}
            </p>
          ) : isSearching ? (
            <p className="m-0 font-sans text-[13px] text-rtfl-ink-2">Searching…</p>
          ) : debouncedQuery && tracks.length === 0 ? (
            <p className="m-0 font-sans text-[13px] text-rtfl-ink-2">
              No songs found. Try a different name.
            </p>
          ) : (
            <div className="flex flex-col gap-[8px]">
              {tracks.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  actionLabel={selectedDays.length > 1 ? `Schedule ×${selectedDays.length}` : "Schedule"}
                  onAction={() => onSchedule(track.id, dates)}
                  disabled={nothingSelected || busy !== null}
                  pending={busy === `schedule:${track.id}`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <label className="flex items-center gap-[10px] rounded-[10px] border border-rtfl-line bg-rtfl-bg p-[0_14px]">
            <span className="text-[13px] text-rtfl-ink-3">⌕</span>
            <input
              type="text"
              value={playlistQuery}
              onChange={e => {
                setPlaylistQuery(e.target.value);
                setPlaylist(null);
              }}
              placeholder="Search Spotify playlists…"
              aria-label="Search for a playlist"
              disabled={nothingSelected}
              className="w-full bg-transparent py-[11px] font-mono text-[13px] text-rtfl-ink placeholder:text-rtfl-ink-3 focus:outline-none disabled:cursor-not-allowed"
            />
          </label>

          {playlist ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-sans text-[13px] text-rtfl-ink">{playlist.name}</span>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setPlaylist(null)}
                    className="rounded-[8px] border border-rtfl-line-soft p-[7px_12px] font-sans text-[11.5px] text-rtfl-ink-2 hover:text-rtfl-ink"
                  >
                    back
                  </button>
                  <button
                    type="button"
                    onClick={() => onScheduleMany(playlistTracks, dates)}
                    disabled={nothingSelected || busy !== null || playlistTracks.length === 0}
                    className={cn(
                      "rounded-[8px] border border-rtfl-accent-line bg-rtfl-accent-bg p-[7px_12px] font-sans text-[11.5px] text-rtfl-accent-ink transition-colors duration-150 hover:border-rtfl-accent",
                      (nothingSelected || busy !== null || playlistTracks.length === 0) &&
                        "cursor-not-allowed opacity-50",
                    )}
                  >
                    {busy === "schedule:batch"
                      ? "…"
                      : `Fill ${selectedDays.length} ${selectedDays.length === 1 ? "day" : "days"}`}
                  </button>
                </div>
              </div>

              {isLoadingTracks ? (
                <p className="m-0 font-sans text-[13px] text-rtfl-ink-2">Loading tracks…</p>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  {playlistTracks.map((track, i) => (
                    <TrackRow
                      key={`${track.id}-${i}`}
                      track={track}
                      actionLabel={selectedDays.length > 1 ? `Schedule ×${selectedDays.length}` : "Schedule"}
                      onAction={() => onSchedule(track.id, dates)}
                      disabled={nothingSelected || busy !== null}
                      pending={busy === `schedule:${track.id}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : isLoadingPlaylists ? (
            <p className="m-0 font-sans text-[13px] text-rtfl-ink-2">Searching…</p>
          ) : debouncedPlaylistQuery.length >= 2 && playlists.length === 0 ? (
            <p className="m-0 font-sans text-[13px] text-rtfl-ink-2">
              No playlists found. Try a different name.
            </p>
          ) : (
            <div className="flex flex-col gap-[6px]">
              {playlists.map((p, i) => (
                <button
                  key={`${p.id}-${i}`}
                  type="button"
                  onClick={() => setPlaylist(p)}
                  className="rounded-[9px] border border-rtfl-line-soft bg-rtfl-surface p-[12px_14px] text-left font-sans text-[13.5px] text-rtfl-ink hover:border-rtfl-ink-3"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
