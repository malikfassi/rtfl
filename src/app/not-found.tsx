import Link from "next/link";

// Masked "words" in the game's own visual language - same underscore
// treatment the lyrics use, so the empty state reads as part of the game.
const MASKED_WORDS = [4, 6, 3].map(len => '_'.repeat(len));

export default function NotFound() {
  return (
    <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex items-center justify-center px-10">
      <div className="border border-rtfl-line rounded-[14px] max-w-[1000px] min-h-[560px] w-full flex flex-col items-center justify-center gap-[22px] px-10 py-[60px]">
        <div aria-hidden="true" className="flex flex-wrap gap-[0.42em] justify-center font-mono font-bold text-[28px] text-rtfl-ink-3">
          {MASKED_WORDS.map((word, i) => (
            <span key={i} className="inline-block rounded-[4px]" style={{ padding: '1px 3px' }}>
              {word}
            </span>
          ))}
        </div>
        <p className="m-0 font-sans text-[14px] text-rtfl-ink-2 text-center max-w-[420px] leading-[1.6]">
          Nothing here to guess. This page has no lyrics, masked or otherwise.
        </p>
        <div className="flex gap-[10px] flex-wrap justify-center">
          <Link href="/" className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px]">
            Today&apos;s song
          </Link>
          <Link href="/archive" className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-line text-rtfl-ink-2 font-sans text-[13px]">
            Browse the archive
          </Link>
        </div>
      </div>
    </div>
  );
}
