"use client";

import React from 'react';
import { cn } from '@/app/front/lib/utils';
import { SegmentedProgressBar, type Segment } from './SegmentedProgressBar';

interface Progress {
  found: number;
  total: number;
}

interface PathToVictoryProps {
  progress: Progress;
  segments: Segment[];
  isGameWon: boolean;
  highlightedWord?: string | null;
  onHoverWord?: (word: string | null) => void;
  onSelectWord?: (segment: { id: string; word: string }) => void;
}

function pct(p: Progress): number {
  return p.total > 0 ? Math.round((p.found / p.total) * 100) : 0;
}

export const PathToVictory = ({
  progress,
  segments,
  isGameWon,
  highlightedWord = null,
  onHoverWord = () => {},
  onSelectWord = () => {},
}: PathToVictoryProps) => {
  const percent = pct(progress);

  return (
    <div className="flex flex-col gap-2" data-testid="game-progress">
      <div className="flex items-baseline gap-2">
        <span className={cn('font-mono font-bold text-[26px] tabular-nums', isGameWon ? 'text-rtfl-hit' : 'text-rtfl-ink')}>
          {percent}%
        </span>
        <span className={cn('font-sans text-[12px]', isGameWon ? 'text-rtfl-hit' : 'text-rtfl-ink-2')}>
          of the lyrics
        </span>
      </div>
      <SegmentedProgressBar
        segments={segments}
        total={progress.total}
        activeWord={highlightedWord}
        heightPx={10}
        ariaLabel="Lyrics, title and artist progress"
        complete={isGameWon}
        onHoverWord={onHoverWord}
        onSelectWord={onSelectWord}
      />
      {!isGameWon && (
        <span className="font-sans text-[11px] text-rtfl-ink-3">
          guess the title and the artist to win
        </span>
      )}
    </div>
  );
};
