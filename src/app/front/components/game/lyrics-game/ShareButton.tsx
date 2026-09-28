"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { cn } from '@/app/front/lib/utils';
import { getWordColorDeterministic, identityColors } from '@/app/front/lib/utils/color-management';
import { precisionPercent } from '@/app/front/lib/utils/progress-calculations';
import type { ShareButtonProps } from './types';

// Captured at this exact size whatever the window is, so every shared PNG
// comes out identical (x2 pixel ratio -> 2400x1350).
const CARD_W = 1200;
const CARD_H = 675;
const SITE = 'rtfl.game';

export const ShareButton = ({
  lyricsPercent,
  attempts,
  hits,
  segments,
  total,
  date,
  dayNumber,
  won = false,
  className,
}: ShareButtonProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  // Non-null while a capture is in flight. The card is mounted off-screen only
  // for that moment: both layouts of the game are mounted at once, so keeping
  // it around permanently would mean two of them for a picture most players
  // never ask for.
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<null | 'saved'>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const precision = precisionPercent(hits, attempts);
  const remainder = Math.max(0, total - segments.reduce((sum, s) => sum + s.hits, 0));

  const headline = won
    ? `I won RTFL #${dayNumber}`
    : `I'm ${lyricsPercent}% into RTFL #${dayNumber}`;
  const callToAction = won ? 'Think you can beat it?' : 'Come help me crack it.';

  const shareText = [
    `${headline} — ${attempts} guess${attempts === 1 ? '' : 'es'}, ${precision}% precision.`,
    callToAction,
    `https://${SITE}`,
  ].join('\n');

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;

    (async () => {
      try {
        if (!cardRef.current) return;
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
        const blob = await (await fetch(dataUrl)).blob();
        if (cancelled) return;

        const file = new File([blob], `rtfl-${dayNumber}.png`, { type: 'image/png' });

        // `canShare` is asked about the actual file: both Android and iOS
        // advertise navigator.share while refusing file payloads in some
        // versions, and sharing then rejects after the image was rendered.
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ text: shareText, files: [file] });
          return;
        }
        if (navigator.share) {
          await navigator.share({ text: shareText, url: `https://${SITE}` });
          return;
        }

        // No share sheet - hand over the same card as a file instead, and put
        // the words on the clipboard so both halves are there to paste.
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `rtfl-${dayNumber}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        await navigator.clipboard?.writeText(shareText).catch(() => {});
        if (!cancelled) {
          setDone('saved');
          setTimeout(() => setDone(null), 2400);
        }
      } catch (err) {
        // Dismissing the sheet rejects with AbortError - not a failure.
        if ((err as Error)?.name !== 'AbortError') console.error('Share failed:', err);
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pending, dayNumber, shareText]);

  const label = pending
    ? 'Preparing…'
    : done === 'saved'
      ? 'Saved — text copied'
      : won
        ? 'Share your win'
        : 'Share for help';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button
        type="button"
        onClick={() => setPending(true)}
        disabled={pending}
        className="inline-flex items-center justify-center gap-[9px] px-[18px] py-[11px] max-sm:w-full rounded-[9px] border border-[#3a3160] bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px] max-sm:text-[14px] hover:border-rtfl-accent-line transition-colors duration-150 disabled:opacity-60"
      >
        <span className="text-[12px]">↗</span>
        {label}
      </button>

      {pending && mounted && createPortal(
        <div aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
          <div
            ref={cardRef}
            style={{ width: CARD_W, height: CARD_H }}
            className="bg-rtfl-surface px-[64px] py-[56px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-6">
              {/* A frozen still of the header logo: the real word, each letter
                  in its identity colour. Animated, html-to-image would catch a
                  random mid-scramble frame. */}
              <span className="font-mono font-bold text-[19px] tracking-[0.12em] text-rtfl-ink flex items-center gap-[0.5ch]">
                <span>READ</span>
                <span>THE</span>
                <span className="inline-flex">
                  {'FUCKING'.split('').map((char, i) => (
                    <span key={i} style={{ color: identityColors[i % identityColors.length] }}>{char}</span>
                  ))}
                </span>
                <span>LYRICS</span>
              </span>
              <span className="font-sans text-[16px] text-rtfl-ink-2 whitespace-nowrap">#{dayNumber} · {date}</span>
            </div>

            <div className="flex flex-col gap-[14px]">
              <span className="font-sans font-medium text-[40px] leading-[1.15] text-rtfl-ink">
                {headline}
              </span>
              <span className="font-sans text-[22px] text-rtfl-ink-2">{callToAction}</span>
            </div>

            <div className="flex flex-col gap-[10px]">
              <div className="flex h-5 rounded-full overflow-hidden bg-rtfl-raised" style={{ gap: 2 }}>
                {segments.map(s => (
                  <div key={s.id} style={{ flexGrow: s.hits, flexBasis: 0, background: getWordColorDeterministic(s.word) }} />
                ))}
                <div style={{ flexGrow: remainder, flexBasis: 0 }} />
              </div>
              <span className="font-sans text-[15px] text-rtfl-ink-3">
                every band is one guess — width is how much of the song it revealed
              </span>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="flex gap-12">
                <span className="flex flex-col gap-[6px]">
                  <span className="font-mono font-bold text-[30px] tabular-nums text-rtfl-hit">{lyricsPercent}%</span>
                  <span className="font-sans text-[13px] uppercase tracking-[0.14em] text-rtfl-ink-2">of the lyrics</span>
                </span>
                <span className="flex flex-col gap-[6px]">
                  <span className="font-mono font-bold text-[30px] tabular-nums text-rtfl-ink">{attempts}</span>
                  <span className="font-sans text-[13px] uppercase tracking-[0.14em] text-rtfl-ink-2">
                    {attempts === 1 ? 'guess' : 'guesses'}
                  </span>
                </span>
                <span className="flex flex-col gap-[6px]">
                  <span className="font-mono font-bold text-[30px] tabular-nums text-rtfl-ink">{precision}%</span>
                  <span className="font-sans text-[13px] uppercase tracking-[0.14em] text-rtfl-ink-2">precision</span>
                </span>
              </div>
              <span className="font-mono font-bold text-[26px] text-rtfl-accent-ink">{SITE}</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
