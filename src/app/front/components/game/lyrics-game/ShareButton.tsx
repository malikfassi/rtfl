"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { cn } from '@/app/front/lib/utils';
import { getWordColorDeterministic } from '@/app/front/lib/utils/color-management';
import type { ShareButtonProps } from './types';

export const ShareButton = ({
  wordsFound,
  guessesUsed,
  bestWordHits,
  overallPercent,
  segments,
  total,
  date,
  dayNumber,
  className,
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // The win strip that renders this button carries `animate-rtfl-rise`. A
  // transform animation - even one whose final value is `none` - makes its
  // element the containing block for `position: fixed` descendants, which
  // collapsed the overlay to the strip's own box. Portalling to <body>
  // takes the overlay out of that subtree entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const remainder = Math.max(0, total - segments.reduce((sum, s) => sum + s.hits, 0));
  const gameUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `rtfl-day-${dayNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate share image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-[9px] px-[18px] py-[11px] max-sm:w-full max-sm:justify-center rounded-[9px] border border-[#3a3160] bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px] max-sm:text-[14px] hover:border-rtfl-accent-line transition-colors duration-150"
      >
        <span className="text-[12px]">◫</span>Share your grid
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="flex flex-col gap-4 w-full max-w-[880px] my-auto" onClick={e => e.stopPropagation()}>
            <div
              ref={cardRef}
              className="w-full aspect-video rounded-2xl border border-rtfl-line bg-rtfl-surface p-[44px_48px] max-sm:p-6 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-5">
                <span className="font-mono font-bold text-[15px] tracking-[0.12em] text-rtfl-ink">READ THE ******* LYRICS</span>
                <span className="font-sans text-[13px] text-rtfl-ink-2 whitespace-nowrap">day {dayNumber} · {date}</span>
              </div>

              <div className="flex flex-col gap-4">
                <span className="font-mono font-bold text-[54px] max-sm:text-[36px] leading-none tabular-nums text-rtfl-ink">
                  {overallPercent}<span className="text-[30px] max-sm:text-[20px] text-rtfl-ink-2">%</span>
                </span>
                <div className="flex h-4 rounded-full overflow-hidden bg-rtfl-raised" style={{ gap: 2 }}>
                  {segments.map(s => (
                    <div key={s.id} style={{ flexGrow: s.hits, flexBasis: 0, background: getWordColorDeterministic(s.word) }} />
                  ))}
                  <div style={{ flexGrow: remainder, flexBasis: 0 }} />
                </div>
                <span className="font-sans text-[13px] text-rtfl-ink-2">every band is one guess — width is how much it revealed</span>
              </div>

              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div className="flex gap-10">
                  <span className="flex flex-col gap-[5px]">
                    <span className="font-mono font-bold text-[22px] tabular-nums text-rtfl-hit">{wordsFound}</span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">found</span>
                  </span>
                  <span className="flex flex-col gap-[5px]">
                    <span className="font-mono font-bold text-[22px] tabular-nums text-rtfl-ink">{guessesUsed}</span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">guesses</span>
                  </span>
                  <span className="flex flex-col gap-[5px]">
                    <span className="font-mono font-bold text-[22px] tabular-nums text-rtfl-ink">{bestWordHits}</span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">best word</span>
                  </span>
                </div>
                <span className="font-sans text-[13px] text-rtfl-ink-3">rtfl.game</span>
              </div>
            </div>

            <div className="flex gap-[10px] flex-wrap">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px] disabled:opacity-60"
              >
                {isDownloading ? 'Generating…' : 'Download PNG'}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-line text-rtfl-ink-2 font-sans text-[13px] hover:text-rtfl-ink hover:border-[#3a4150]"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
