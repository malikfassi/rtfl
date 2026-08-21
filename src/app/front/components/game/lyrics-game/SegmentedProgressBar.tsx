"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/app/front/lib/utils';
import { getWordColorDeterministic } from '@/app/front/lib/utils/color-management';

export interface Segment {
  id: string;
  word: string;
  hits: number;
}

interface SegmentedProgressBarProps {
  segments: Segment[];
  total: number;
  activeWord?: string | null;
  heightPx?: number;
  targetPercent?: number;
  ariaLabel?: string;
  onHoverWord?: (word: string | null) => void;
  onSelectWord?: (segment: { id: string; word: string }) => void;
  /** True once this path's win condition is met - runs the one-shot sweep. */
  complete?: boolean;
  className?: string;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  segments,
  total,
  activeWord,
  heightPx = 8,
  targetPercent,
  ariaLabel = '',
  onHoverWord,
  onSelectWord,
  complete = false,
  className,
}) => {
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  // Bumped whenever a segment appears, to restart the row flash animation -
  // a boolean would only fire once, since re-setting it to the same value
  // doesn't retrigger CSS.
  const [flashKey, setFlashKey] = useState(0);

  // Keyed on the ids themselves, not the array: `segments` is rebuilt on
  // every parent render, which would re-run this each time and clear
  // `newIds` before the pop-in animation had a chance to play.
  const segmentKey = segments.map(s => s.id).join(',');

  useEffect(() => {
    const currentIds = new Set(segmentKey ? segmentKey.split(',') : []);
    const added = new Set<string>();
    currentIds.forEach(id => {
      if (!prevIdsRef.current.has(id)) added.add(id);
    });
    const isFirstFill = prevIdsRef.current.size === 0;
    setNewIds(added);
    prevIdsRef.current = currentIds;
    // Skip the initial hydration pass, otherwise every bar flashes on load.
    if (added.size > 0 && !isFirstFill) setFlashKey(k => k + 1);
  }, [segmentKey]);

  const hitsInBar = new Set(segments.map(s => s.word.toLowerCase()));
  const activeInBar = !!activeWord && hitsInBar.has(activeWord.toLowerCase());
  const remainder = Math.max(0, total - segments.reduce((sum, s) => sum + s.hits, 0));

  return (
    <div
      className={cn('relative w-full rounded-full bg-rtfl-raised', className)}
      style={{ height: heightPx }}
      role="progressbar"
      aria-label={ariaLabel}
    >
      {/* Keyed so each new segment restarts it; kept off the container so
          the bar itself never remounts and its widths stay animated. */}
      {flashKey > 0 && (
        <span
          key={flashKey}
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none animate-rtfl-bar-flash"
        />
      )}
      <div className="flex h-full rounded-full overflow-hidden" style={{ gap: 1 }}>
        {segments.map(segment => {
          const color = getWordColorDeterministic(segment.word);
          const isActive = activeWord?.toLowerCase() === segment.word.toLowerCase();
          const isDimmed = activeInBar && !isActive;
          return (
            <div
              key={segment.id}
              className={cn(
                'h-full cursor-pointer transition-[opacity,flex-grow] duration-[420ms] ease-rtfl',
                newIds.has(segment.id) && 'animate-rtfl-pop-in'
              )}
              style={{
                flexGrow: segment.hits,
                flexBasis: 0,
                minWidth: total > 0 ? undefined : 0,
                background: color,
                opacity: isDimmed ? 0.35 : 1,
                transformOrigin: 'left',
              }}
              title={`${segment.word} (${segment.hits})`}
              onMouseEnter={() => onHoverWord?.(segment.word)}
              onMouseLeave={() => onHoverWord?.(null)}
              onClick={() => onSelectWord?.({ id: segment.id, word: segment.word })}
            />
          );
        })}
        <div className="h-full bg-transparent" style={{ flexGrow: remainder, flexBasis: 0 }} />
      </div>
      {typeof targetPercent === 'number' && (
        <span
          aria-hidden="true"
          className="absolute top-0 bg-rtfl-ink-ghost"
          style={{ left: `${targetPercent}%`, width: 2, height: '100%' }}
        />
      )}
      {complete && (
        <span aria-hidden="true" className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <span
            className="block h-full w-1/3 animate-rtfl-sweep"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          />
        </span>
      )}
    </div>
  );
};
