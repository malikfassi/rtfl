"use client";

import React from "react";
import type { Track } from "@spotify/web-api-ts-sdk";
import { cn } from "@/app/front/lib/utils";
import { formatTrackMeta, trackThumbnail } from "./day-model";

interface TrackRowProps {
  track: Track;
  /** Right-hand note: word count for a scheduled song, nothing for a search hit. */
  note?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  pending?: boolean;
  /** Draws the action in the destructive palette instead of the accent one. */
  destructive?: boolean;
}

/**
 * The spec's result row, used for every track the admin can act on: search
 * hits, playlist tracks, and the song already sitting on a selected day.
 */
export function TrackRow({
  track,
  note,
  actionLabel,
  onAction,
  disabled,
  pending,
  destructive,
}: TrackRowProps) {
  const thumbnail = trackThumbnail(track);

  return (
    <div className="flex items-center gap-[14px] rounded-[9px] border border-rtfl-line-soft bg-rtfl-surface p-[12px_14px]">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="h-[38px] w-[38px] shrink-0 rounded-[5px] object-cover"
        />
      ) : (
        <span className="h-[38px] w-[38px] shrink-0 rounded-[5px] bg-rtfl-raised" />
      )}

      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate font-sans text-[14px] text-rtfl-ink">{track.name}</span>
        <span className="truncate font-sans text-[11.5px] text-rtfl-ink-3">
          {formatTrackMeta(track)}
        </span>
      </span>

      {note && (
        <span className="shrink-0 text-right font-sans text-[11px] text-rtfl-ink-3">{note}</span>
      )}

      <button
        type="button"
        onClick={onAction}
        disabled={disabled || pending}
        className={cn(
          "shrink-0 rounded-[8px] border p-[8px_14px] font-sans text-[12px] transition-colors duration-150",
          destructive
            ? "border-rtfl-error/40 bg-rtfl-error/10 text-rtfl-error hover:bg-rtfl-error/20"
            : "border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink hover:border-rtfl-accent",
          (disabled || pending) && "cursor-not-allowed opacity-50",
        )}
      >
        {pending ? "…" : actionLabel}
      </button>
    </div>
  );
}
