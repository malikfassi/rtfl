"use client";

import React, { useState } from 'react';
import { cn } from '@/app/front/lib/utils';
import { precisionPercent } from '@/app/front/lib/utils/progress-calculations';
import { ShareButton } from './ShareButton';
import type { Segment } from './SegmentedProgressBar';

interface WinSummaryProps {
  lyricsPercent: number;
  attempts: number;
  hits: number;
  segments: Segment[];
  total: number;
  date: string;
  dayNumber: number;
  song?: { title?: string; artist?: string; spotifyId?: string; geniusUrl?: string };
  /** Stacks the stats and lets the share button go full width. */
  compact?: boolean;
}

function Stat({ value, label, accent }: { value: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span className="flex flex-col gap-[5px]">
      <span className={cn('font-mono font-bold tabular-nums text-[22px]', accent ? 'text-rtfl-hit' : 'text-rtfl-ink')}>
        {value}
      </span>
      <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">{label}</span>
    </span>
  );
}

export const WinSummary = ({
  lyricsPercent,
  attempts,
  hits,
  segments,
  total,
  date,
  dayNumber,
  song,
  compact = false,
}: WinSummaryProps) => {
  // Open on arrival - this is the moment the game pays off - but collapsible,
  // because expanded it eats most of a phone screen and the lyrics the player
  // just uncovered are the thing they want to read.
  const [expanded, setExpanded] = useState(true);
  const precision = precisionPercent(hits, attempts);

  return (
    <div
      className={cn(
        'border-t border-rtfl-line-soft bg-rtfl-surface animate-rtfl-rise flex flex-col',
        expanded ? 'gap-4' : 'gap-0',
        compact ? 'px-5 py-3' : 'px-[56px] py-[18px]',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-baseline gap-3 min-w-0">
          <span className="font-sans text-[13px] text-rtfl-hit shrink-0">✓ solved</span>
          {!expanded && (
            // Both figures are percentages, so each keeps its noun here -
            // "10% · 63%" on its own says nothing about which is which.
            <span className="font-sans text-[12px] text-rtfl-ink-2 truncate">
              <span className="tabular-nums">{lyricsPercent}%</span> lyrics ·{' '}
              <span className="tabular-nums">{attempts}</span> {attempts === 1 ? 'guess' : 'guesses'} ·{' '}
              <span className="tabular-nums">{precision}%</span> precision
            </span>
          )}
        </span>
        <span
          className="font-sans text-[10px] text-rtfl-ink-3 transition-transform duration-[180ms] shrink-0"
          style={{ transform: expanded ? 'none' : 'rotate(180deg)' }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <>
          <div className={cn('flex gap-10', compact && 'justify-between gap-3')}>
            <Stat value={`${lyricsPercent}%`} label="of the lyrics" accent />
            <Stat value={attempts} label={attempts === 1 ? 'guess' : 'guesses'} />
            <Stat value={`${precision}%`} label="precision" />
          </div>

          {song?.spotifyId && (
            <iframe
              title={`${song.title ?? 'Track'} on Spotify`}
              src={`https://open.spotify.com/embed/track/${song.spotifyId}`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-[10px] block"
            />
          )}

          <div className={cn('flex items-center gap-3 flex-wrap', compact && 'flex-col items-stretch')}>
            <ShareButton
              lyricsPercent={lyricsPercent}
              attempts={attempts}
              hits={hits}
              segments={segments}
              total={total}
              date={date}
              dayNumber={dayNumber}
            />
            {song?.geniusUrl && (
              <a
                href={song.geniusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'font-sans text-[13px] text-rtfl-ink-2 hover:text-rtfl-ink underline underline-offset-4 decoration-rtfl-line',
                  compact && 'text-center',
                )}
              >
                full lyrics on Genius
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
};
