"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { cn } from "@/app/front/lib/utils";
import { getWordColorDeterministic } from "@/app/front/lib/utils/color-management";
import type { Token, Guess } from "@/app/types";

/** A single guessable token: underscores while masked, plain text once revealed. */
const WordToken = React.forwardRef<HTMLSpanElement, {
  token: Token;
  isActive: boolean;
  isGranted: boolean;
  waveDelayMs: number | null;
}>(({ token, isActive, isGranted, waveDelayMs }, ref) => {
  const isMasked = /^_+$/.test(token.value);

  if (isMasked) {
    // One span per word, not per underscore character - the run of
    // underscores is already the right width in a monospace face, and the
    // padding stays constant across states so highlighting never reflows.
    return (
      <span
        ref={ref}
        className="inline-block align-baseline rounded-[4px] text-rtfl-ink-3"
        style={{ padding: "1px 3px" }}
      >
        {token.value}
      </span>
    );
  }

  const color = getWordColorDeterministic(token.value);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block align-baseline rounded-[4px] transition-[background-color,color] duration-150",
        isGranted ? "text-rtfl-ink-3" : "text-rtfl-ink",
        waveDelayMs !== null && "animate-rtfl-wave"
      )}
      style={{
        padding: "1px 3px",
        background: isActive ? color : "transparent",
        color: isActive ? "#0f1115" : undefined,
        animationDelay: waveDelayMs !== null ? `${waveDelayMs}ms` : undefined,
      }}
    >
      {token.value}
    </span>
  );
});
WordToken.displayName = "WordToken";

function useIdentity(guesses: Guess[]) {
  return useMemo(
    () => new Set(guesses.filter(g => g.valid).map(g => g.word.toLowerCase())),
    [guesses]
  );
}

/** Splits a flat token stream into stanzas of lines, dropping newline tokens
 * (they become structural gaps, not literal text) and keeping every other
 * verbatim token — spaces, punctuation — as-is, since it carries the song's
 * own spacing. Two or more newlines in one whitespace token start a new
 * stanza; a single newline just starts a new line. */
function groupIntoStanzas(tokens: Token[]): Token[][][] {
  const stanzas: Token[][][] = [[[]]];
  for (const token of tokens) {
    if (!token.isToGuess && token.value.includes("\n")) {
      const newlineCount = (token.value.match(/\n/g) || []).length;
      const isStanzaBreak = newlineCount >= 2;
      if (isStanzaBreak) {
        stanzas.push([[]]);
      } else {
        stanzas[stanzas.length - 1].push([]);
      }
      continue;
    }
    const stanza = stanzas[stanzas.length - 1];
    stanza[stanza.length - 1].push(token);
  }
  return stanzas;
}

interface TokenRunProps {
  tokens: Token[];
  guesses: Guess[];
  activeWord: string | null;
  revealed: boolean;
  scrollToWord?: string | null;
  scrollRef?: React.RefObject<HTMLSpanElement>;
  waveIndexRef: { current: number };
  keyPrefix: string;
}

function useTokenRenderer({ guesses, activeWord, revealed, scrollToWord, scrollRef, waveIndexRef }: Omit<TokenRunProps, 'tokens' | 'keyPrefix'>) {
  const foundWords = useIdentity(guesses);
  // Reset every render: only the first matching token of the *current* pass
  // gets the scroll ref. Left latched, it would pin the ref to whichever
  // word happened to match first and never move again.
  const scrollClaimedRef = useRef(false);
  scrollClaimedRef.current = false;

  function renderToken(token: Token, key: React.Key) {
    if (!token.isToGuess) {
      return <React.Fragment key={key}>{token.value}</React.Fragment>;
    }

    const isMasked = /^_+$/.test(token.value);
    const isActive = !isMasked && activeWord !== null && token.value.toLowerCase() === activeWord;
    const isGranted = !isMasked && revealed && !foundWords.has(token.value.toLowerCase());

    let ref: React.RefObject<HTMLSpanElement> | undefined;
    if (!isMasked && !scrollClaimedRef.current && scrollRef && scrollToWord && token.value.toLowerCase() === scrollToWord.toLowerCase()) {
      ref = scrollRef;
      scrollClaimedRef.current = true;
    }

    const waveDelayMs = isGranted ? waveIndexRef.current * 14 : null;
    if (isGranted) waveIndexRef.current += 1;

    return (
      <WordToken
        key={key}
        token={token}
        isActive={isActive}
        isGranted={isGranted}
        waveDelayMs={waveDelayMs}
        ref={ref}
      />
    );
  }

  return renderToken;
}

interface MaskedTitleArtistProps {
  maskedTitleParts: Token[];
  maskedArtistParts: Token[];
  highlightedWord?: string | null;
  guesses: Guess[];
  revealed: boolean;
}

/** The non-scrolling title/artist header block (desktop's own region above the lyrics pane). */
export function MaskedTitleArtist({ maskedTitleParts, maskedArtistParts, highlightedWord, guesses, revealed }: MaskedTitleArtistProps) {
  const waveIndexRef = useRef(0);
  waveIndexRef.current = 0;
  const activeWord = highlightedWord?.toLowerCase() ?? null;
  const renderToken = useTokenRenderer({ guesses, activeWord, revealed, waveIndexRef });

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex flex-wrap items-baseline gap-0 font-mono font-bold text-[30px] max-sm:text-[21px] leading-[1.5]">
        {maskedTitleParts.map((t, i) => renderToken(t, `title-${i}`))}
      </div>
      <div className="flex flex-wrap items-baseline gap-0 text-[15px] max-sm:text-[13px] leading-[1.6]">
        <span className="font-sans text-rtfl-ink-3 mr-[0.42em]">by</span>
        {maskedArtistParts.map((t, i) => renderToken(t, `artist-${i}`))}
      </div>
    </div>
  );
}

interface MaskedLyricsBodyProps {
  maskedLyricsParts: Token[];
  highlightedWord?: string | null;
  scrollToWord?: string | null;
  /** Bumped on every selection so re-selecting the same word scrolls again. */
  scrollTick?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  guesses: Guess[];
  revealed: boolean;
}

/** The scrolling lyrics pane. */
export function MaskedLyricsBody({ maskedLyricsParts, highlightedWord, scrollToWord, scrollTick, scrollContainerRef, guesses, revealed }: MaskedLyricsBodyProps) {
  const firstScrollToWordRef = useRef<HTMLSpanElement | null>(null);
  const waveIndexRef = useRef(0);
  waveIndexRef.current = 0;
  const activeWord = highlightedWord?.toLowerCase() ?? null;
  const renderToken = useTokenRenderer({
    guesses,
    activeWord,
    revealed,
    scrollToWord,
    scrollRef: firstScrollToWordRef,
    waveIndexRef,
  });

  useEffect(() => {
    if (firstScrollToWordRef.current && scrollToWord && scrollContainerRef?.current) {
      const wordEl = firstScrollToWordRef.current;
      const container = scrollContainerRef.current;
      const wordRect = wordEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = wordRect.top - containerRect.top - (containerRect.height / 2) + (wordRect.height / 2);
      container.scrollBy({ top: offset, behavior: "smooth" });
    }
    // scrollTick changes on every selection, so re-picking the word that is
    // already selected still scrolls back to it.
  }, [scrollToWord, scrollTick, scrollContainerRef]);

  const stanzas = groupIntoStanzas(maskedLyricsParts);

  return (
    <div className="flex flex-col gap-[26px] max-sm:gap-[20px]">
      {stanzas.map((lines, sIdx) => (
        <div key={sIdx} className="flex flex-col gap-[7px]">
          {lines.map((line, lIdx) => (
            <div key={lIdx} className="flex flex-wrap items-baseline gap-0 font-mono text-[17px] max-sm:text-[15px] leading-[1.85]">
              {line.map((t, i) => renderToken(t, `l-${sIdx}-${lIdx}-${i}`))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface MaskedLyricsDisplayProps {
  maskedTitleParts: Token[];
  maskedArtistParts: Token[];
  maskedLyricsParts: Token[];
  highlightedWord?: string | null;
  scrollToWord?: string | null;
  scrollTick?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  guesses: Guess[];
  revealed: boolean;
}

/** Title + artist + lyrics combined in one flow — mobile's single scrolling pane. */
export function MaskedLyricsDisplay({
  maskedTitleParts,
  maskedArtistParts,
  maskedLyricsParts,
  highlightedWord,
  scrollToWord,
  scrollTick,
  scrollContainerRef,
  guesses,
  revealed,
}: MaskedLyricsDisplayProps) {
  return (
    <div data-testid="masked-lyrics" className="flex flex-col gap-8">
      <MaskedTitleArtist
        maskedTitleParts={maskedTitleParts}
        maskedArtistParts={maskedArtistParts}
        highlightedWord={highlightedWord}
        guesses={guesses}
        revealed={revealed}
      />
      <MaskedLyricsBody
        maskedLyricsParts={maskedLyricsParts}
        highlightedWord={highlightedWord}
        scrollToWord={scrollToWord}
        scrollTick={scrollTick}
        scrollContainerRef={scrollContainerRef}
        guesses={guesses}
        revealed={revealed}
      />
    </div>
  );
}
