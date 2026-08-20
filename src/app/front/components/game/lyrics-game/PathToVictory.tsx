"use client";

import React from 'react';
import { cn } from '@/app/front/lib/utils';
import { SegmentedProgressBar, type Segment } from './SegmentedProgressBar';

interface Progress {
  found: number;
  total: number;
}

interface PathToVictoryProps {
  lyricsProgress: Progress;
  titleProgress: Progress;
  artistProgress: Progress;
  lyricsSegments: Segment[];
  creditsSegments: Segment[];
  highlightedWord?: string | null;
  onHoverWord?: (word: string | null) => void;
  onSelectWord?: (segment: { id: string; word: string }) => void;
  /** Owned by LyricsGame so it survives this component unmounting on a refetch. */
  victoryOpen: boolean;
  onToggleVictory: () => void;
}

const TARGET_PERCENT = 80;

function pct(p: Progress): number {
  return p.total > 0 ? Math.round((p.found / p.total) * 100) : 0;
}

export const PathToVictory = ({
  lyricsProgress,
  titleProgress,
  artistProgress,
  lyricsSegments,
  creditsSegments,
  highlightedWord = null,
  onHoverWord = () => {},
  onSelectWord = () => {},
  victoryOpen,
  onToggleVictory,
}: PathToVictoryProps) => {
  const lyricsPct = pct(lyricsProgress);
  const titleWin = titleProgress.total > 0 && titleProgress.found === titleProgress.total;
  const artistWin = artistProgress.total > 0 && artistProgress.found === artistProgress.total;
  const lyricsWin = lyricsProgress.total > 0 && lyricsProgress.found / lyricsProgress.total >= 0.8;
  const creditsWin = titleWin && artistWin;
  const isVictory = lyricsWin || creditsWin;

  const headline = isVictory
    ? (lyricsWin && creditsWin ? 'solved — both ways at once' : lyricsWin ? 'solved — 80% of the lyrics' : 'solved — you named the song')
    : `of the lyrics · 80% wins`;

  return (
    <div className="relative" data-testid="game-progress">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onToggleVictory}
          className="flex items-baseline justify-between gap-2 text-left"
        >
          <span className="flex items-baseline gap-2">
            <span className={cn('font-mono font-bold text-[26px] tabular-nums', isVictory ? 'text-rtfl-hit' : 'text-rtfl-ink')}>
              {lyricsPct}%
            </span>
            <span className={cn('font-sans text-[12px]', isVictory ? 'text-rtfl-hit' : 'text-rtfl-ink-2')}>
              {headline}
            </span>
          </span>
        </button>

        {/* `complete` is the overall win here, not just the lyrics path: this
            is the only bar always on screen, so a credits win would otherwise
            sweep only inside the closed detail overlay and never be seen. */}
        <SegmentedProgressBar
          segments={lyricsSegments}
          total={lyricsProgress.total}
          activeWord={highlightedWord}
          heightPx={10}
          targetPercent={TARGET_PERCENT}
          ariaLabel="Lyrics progress"
          complete={isVictory}
          onHoverWord={onHoverWord}
          onSelectWord={onSelectWord}
        />

        <button
          type="button"
          onClick={onToggleVictory}
          className="self-start font-sans text-[11px] text-rtfl-ink-2 flex items-center gap-1"
        >
          how to win
          <span
            className="text-[10px] transition-transform duration-[180ms]"
            style={{ transform: victoryOpen ? 'rotate(180deg)' : 'none' }}
          >
            ▾
          </span>
        </button>
      </div>

      {victoryOpen && (
        <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-rtfl-surface border border-rtfl-line rounded-[10px] p-4 flex flex-col gap-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <p className="font-sans text-[12px] text-rtfl-ink-2 m-0">
            Two ways in — whichever one fills up first ends the game.
          </p>

          <div className={cn('flex flex-col gap-2 rounded-[8px] border p-3', lyricsWin ? 'border-rtfl-hit/50 bg-rtfl-hit/[0.06]' : 'border-rtfl-line')}>
            <div className="flex items-center gap-2 font-sans text-[12px] text-rtfl-ink">
              <span className="w-4 h-4 rounded-full bg-rtfl-raised flex items-center justify-center text-[10px] text-rtfl-ink-2">A</span>
              reveal 80% of the lyrics
            </div>
            <SegmentedProgressBar
              segments={lyricsSegments}
              total={lyricsProgress.total}
              activeWord={highlightedWord}
              heightPx={8}
              targetPercent={TARGET_PERCENT}
              ariaLabel="Path A — lyrics"
              complete={lyricsWin}
              onHoverWord={onHoverWord}
              onSelectWord={onSelectWord}
            />
            <span className="font-sans text-[11px] text-rtfl-ink-2">
              {lyricsProgress.found} of {lyricsProgress.total} words · target {TARGET_PERCENT}% · {Math.ceil(lyricsProgress.total * 0.8)} words
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex-1 h-px bg-rtfl-line" />
            <span className="font-sans text-[10px] tracking-[0.16em] text-rtfl-ink-3">OR</span>
            <span className="flex-1 h-px bg-rtfl-line" />
          </div>

          <div className={cn('flex flex-col gap-2 rounded-[8px] border p-3', creditsWin ? 'border-rtfl-hit/50 bg-rtfl-hit/[0.06]' : 'border-rtfl-line')}>
            <div className="flex items-center gap-2 font-sans text-[12px] text-rtfl-ink">
              <span className="w-4 h-4 rounded-full bg-rtfl-raised flex items-center justify-center text-[10px] text-rtfl-ink-2">B</span>
              name the song and the artist
            </div>
            <SegmentedProgressBar
              segments={creditsSegments}
              total={titleProgress.total + artistProgress.total}
              activeWord={highlightedWord}
              heightPx={8}
              ariaLabel="Path B — credits"
              complete={creditsWin}
              onHoverWord={onHoverWord}
              onSelectWord={onSelectWord}
            />
            <span className="font-sans text-[11px] text-rtfl-ink-2">
              title {titleProgress.found}/{titleProgress.total} · artist {artistProgress.found}/{artistProgress.total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
