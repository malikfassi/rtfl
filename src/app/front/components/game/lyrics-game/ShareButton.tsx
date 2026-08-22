"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { cn } from '@/app/front/lib/utils';
import { getWordColorDeterministic, identityColors } from '@/app/front/lib/utils/color-management';
import { precisionPercent } from '@/app/front/lib/utils/progress-calculations';
import type { ShareButtonProps } from './types';

// The card is captured at this exact size whatever the browser window is, so
// every shared PNG comes out identical (x2 pixel ratio -> 2400x1350).
const CARD_W = 1200;
const CARD_H = 675;

export const ShareButton = ({
  lyricsPercent,
  attempts,
  hits,
  segments,
  total,
  date,
  dayNumber,
  className,
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  // Which capture is waiting on the card being mounted. Both layouts of the
  // game are mounted at once, so a permanently-rendered off-screen card would
  // exist twice over for a picture most players never ask for.
  const [pending, setPending] = useState<null | 'share' | 'download'>(null);
  const [copied, setCopied] = useState(false);
  const isBusy = pending !== null;
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // Display-only shrink factor. It lives on a wrapper, never on the captured
  // node, so the export is unaffected by how the preview happens to fit.
  const [scale, setScale] = useState(1);

  // The win strip that renders this button carries `animate-rtfl-rise`. A
  // transform animation - even one whose final value is `none` - makes its
  // element the containing block for `position: fixed` descendants, which
  // collapsed the overlay to the strip's own box. Portalling to <body>
  // takes the overlay out of that subtree entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (frameRef.current) setScale(Math.min(1, frameRef.current.clientWidth / CARD_W));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  const remainder = Math.max(0, total - segments.reduce((sum, s) => sum + s.hits, 0));
  const gameUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const shareText = [
    `RTFL day ${dayNumber} — solved`,
    `${lyricsPercent}% of the lyrics · ${attempts} guess${attempts === 1 ? '' : 'es'} · ${hits} landed`,
    gameUrl,
  ].join('\n');

  // Runs after the card has been committed to the DOM, which is what makes
  // mounting it on demand workable: the ref is guaranteed to be live here.
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;

    (async () => {
      try {
        if (!cardRef.current) return;
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
        const blob = await (await fetch(dataUrl)).blob();
        if (cancelled) return;

        if (pending === 'download') {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `rtfl-day-${dayNumber}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          return;
        }

        // `canShare` is checked with the actual file: both Android and iOS
        // advertise navigator.share while refusing file payloads in some
        // versions, and sharing then rejects after the image was rendered.
        const file = new File([blob], `rtfl-day-${dayNumber}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ text: shareText, files: [file] });
        } else {
          await navigator.share({ text: shareText, url: gameUrl });
        }
      } catch (err) {
        // Dismissing the sheet rejects with AbortError - not a failure worth
        // reporting, and not a reason to fall back to the overlay.
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Share failed:', err);
          if (!cancelled) setOpen(true);
        }
      } finally {
        if (!cancelled) setPending(null);
      }
    })();

    return () => { cancelled = true; };
  }, [pending, dayNumber, shareText, gameUrl]);

  const handleShare = () => {
    // No share sheet (desktop, or an insecure context): the overlay is the
    // whole feature there, so go straight to it rather than rendering a PNG
    // nobody asked for.
    if (typeof navigator === 'undefined' || !navigator.share) {
      setOpen(true);
      return;
    }
    setPending('share');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // The card has to exist in the DOM to be captured, even when the sheet is
  // doing the sharing - kept off-screen rather than rendered twice.
  const card = (
    <div
      ref={cardRef}
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-2xl border border-rtfl-line bg-rtfl-surface p-[44px_48px] flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-5">
        {/* A frozen still of the header logo: the real word, each letter in
            its identity colour, no wobble or scramble - html-to-image would
            capture a random mid-animation frame. */}
        <span className="font-mono font-bold text-[15px] tracking-[0.12em] text-rtfl-ink flex items-center gap-[0.5ch]">
          <span>READ</span>
          <span>THE</span>
          <span className="inline-flex">
            {'FUCKING'.split('').map((char, i) => (
              <span key={i} style={{ color: identityColors[i % identityColors.length] }}>
                {char}
              </span>
            ))}
          </span>
          <span>LYRICS</span>
        </span>
        <span className="font-sans text-[13px] text-rtfl-ink-2 whitespace-nowrap">day {dayNumber} · {date}</span>
      </div>

      <div className="flex flex-col gap-4">
        <span className="font-mono font-bold text-[54px] leading-none tabular-nums text-rtfl-ink">
          {lyricsPercent}<span className="text-[30px] text-rtfl-ink-2">%</span>
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
            <span className="font-mono font-bold text-[22px] tabular-nums text-rtfl-ink">{attempts}</span>
            <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">guesses</span>
          </span>
          <span className="flex flex-col gap-[5px]">
            <span className="font-mono font-bold text-[22px] tabular-nums text-rtfl-ink">
              {precisionPercent(hits, attempts)}%
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-rtfl-ink-2">precision</span>
          </span>
        </div>
        <span className="font-sans text-[13px] text-rtfl-ink-3">rtfl.game</span>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={handleShare}
        disabled={isBusy}
        className="inline-flex items-center gap-[9px] px-[18px] py-[11px] max-sm:w-full max-sm:justify-center rounded-[9px] border border-[#3a3160] bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px] max-sm:text-[14px] hover:border-rtfl-accent-line transition-colors duration-150 disabled:opacity-60"
      >
        <span className="text-[12px]">↗</span>
        {isBusy ? 'Preparing…' : `Share day ${dayNumber}`}
      </button>

      {/* Mounted off-screen only for the moment a capture needs it. */}
      {!open && pending && mounted && createPortal(
        <div aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
          {card}
        </div>,
        document.body,
      )}

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div ref={frameRef} className="flex flex-col gap-4 w-full max-w-[880px] my-auto" onClick={e => e.stopPropagation()}>
            <div className="relative overflow-hidden" style={{ height: CARD_H * scale }}>
              <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {card}
              </div>
            </div>

            <div className="flex gap-[10px] flex-wrap">
              <button
                type="button"
                onClick={() => setPending('download')}
                disabled={isBusy}
                className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px] disabled:opacity-60"
              >
                {isBusy ? 'Generating…' : 'Download PNG'}
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-line text-rtfl-ink-2 font-sans text-[13px] hover:text-rtfl-ink hover:border-[#3a4150]"
              >
                {copied ? 'Copied!' : 'Copy result'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
