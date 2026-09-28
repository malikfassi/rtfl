"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ScrambleTitle } from '../ScrambleTitle';
import { YesterdayStats } from '../YesterdayStats';
import { GuessHistory, GuessInput, MaskedTitleArtist, MaskedLyricsBody, PathToVictory, WinSummary, ShareButton, LyricsLoadingComponent, PlayerIdBadge } from './index';
import { calculateGuessHits, countTotalHits } from '@/app/front/lib/utils/hit-counting';
import { getWordColorDeterministic } from '@/app/front/lib/utils/color-management';
import { calculateGameProgress } from '@/app/front/lib/utils/progress-calculations';
import { getDayNumber, isValidDate } from '@/app/front/lib/utils/date-formatting';
import { cn } from '@/app/front/lib/utils';
import { useScrollFog } from '@/app/front/hooks/useScrollFog';
import { useWordSelection } from '@/app/front/hooks/useWordSelection';
import type { LyricsGameProps } from './types';

export function LyricsGame({ gameState, onGuess, date, playerId }: LyricsGameProps) {
  const {
    selectedGuess,
    scrollToWord,
    scrollTick,
    activeWord,
    hover: handleWordHover,
    select: handleGuessSelect,
    reveal: revealGuess,
  } = useWordSelection();

  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  /** True for a beat after the guess that won, to sweep in the granted words. */
  const [justWon, setJustWon] = useState(false);

  // The desktop and mobile layouts are both mounted at all times (one is
  // hidden by a `lg:` class), so they need separate refs - sharing one meant
  // the second element to mount silently overwrote the first, pointing the
  // fog listener and scroll-to-word at the hidden pane.
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const { showTop: showTopFog, showBottom: showBottomFog } = useScrollFog(desktopScrollRef);

  // onGuess resolves with the freshly-fetched GameState from the mutation
  // response - using that directly (rather than the parent's gameState,
  // which hasn't re-rendered with this guess yet) avoids a stale-props read.
  const handleGuessSubmit = async (guess: string): Promise<number> => {
    setPendingGuess(guess);
    try {
      const freshState = await onGuess(guess);
      if (!freshState) return 0;

      const submittedGuess = freshState.guesses
        .filter(g => g.word.toLowerCase() === guess.toLowerCase() && g.valid)
        .pop();
      if (submittedGuess) {
        revealGuess({ id: submittedGuess.id, word: submittedGuess.word });
      }

      // Recognised here rather than by watching `revealed` flip, because the
      // refetch that follows a guess briefly drops gameState and remounts the
      // lyrics - a component that is rebuilt cannot see its own transition.
      // Tying it to the guess also means a solved page loaded fresh, where no
      // guess was made, stays still.
      if (freshState.song && !gameState?.song) {
        setJustWon(true);
        window.setTimeout(() => setJustWon(false), 2000);
      }

      return countTotalHits({
        word: guess,
        maskedLyricsParts: freshState.masked.lyrics,
        maskedTitleParts: freshState.masked.title,
        maskedArtistParts: freshState.masked.artist,
      });
    } finally {
      setPendingGuess(null);
    }
  };

  const handleDuplicateGuess = (guess: string) => {
    if (!gameState) return;
    const existingGuess = gameState.guesses.find(g => g.word.toLowerCase() === guess.toLowerCase());
    if (existingGuess) {
      revealGuess({ id: existingGuess.id, word: existingGuess.word });
    }
  };

  const isLoading = !gameState;
  const revealed = !!gameState?.song; // gameState.song presence IS the win state
  const hasGuessed = (gameState?.guesses.length ?? 0) > 0;
  const dayNumber = getDayNumber(date);
  // The stand-in song isn't the day that was asked for, so the day counter and
  // yesterday's stats would both be talking about a game that doesn't exist.
  const isFallback = !!gameState?.fallbackReason;

  const validGuesses = gameState?.guesses.filter(g => g.valid) ?? [];
  const foundWordsAll = Array.from(new Set(validGuesses.map(g => g.word.toLowerCase())));

  const progress = gameState ? calculateGameProgress({
    foundWords: foundWordsAll,
    maskedLyricsParts: gameState.masked.lyrics,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }) : null;

  const lyricsHits = gameState ? calculateGuessHits({
    guesses: validGuesses,
    maskedLyricsParts: gameState.masked.lyrics,
  }) : [];

  const creditsHits = gameState ? calculateGuessHits({
    guesses: validGuesses,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }) : [];

  // The rail's single progress bar folds title/artist words into the same
  // pool as the lyrics - a word that also names the song or artist keeps
  // its normal color but gets an outline, so it reads as both at a glance.
  const combinedSegments = lyricsHits
    .map((g, i) => {
      const creditHits = creditsHits[i]?.hits ?? 0;
      return { id: g.id, word: g.word, hits: g.hits + creditHits, isCredit: creditHits > 0 };
    })
    .filter(s => s.hits > 0);

  // Every guess with its hit count, misses included - the mobile chip row
  // needs the zero-hit ones too, so this can't be filtered like the bars.
  const allGuessHits = gameState ? calculateGuessHits({
    guesses: gameState.guesses,
    maskedLyricsParts: gameState.masked.lyrics,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }) : [];

  // `valid` is decided by hasWord(), which tests the same predicate as the hit
  // counter - so a valid guess always has at least one hit, and the two can
  // never disagree. Filtering on both would just say the same thing twice.
  const overallSegments = allGuessHits
    .filter(g => g.valid)
    .map(g => ({ id: g.id, word: g.word, hits: g.hits }));

  const titleWin = !!progress && progress.title.progress.total > 0 && progress.title.progress.found === progress.title.progress.total;
  const artistWin = !!progress && progress.artist.progress.total > 0 && progress.artist.progress.found === progress.artist.progress.total;
  const isGameWon = titleWin && artistWin;
  // One percentage for the whole screen. The rail's bar folds the title and
  // artist in with the lyrics, so a summary quoting the lyrics alone put two
  // different numbers under the same words a few centimetres apart.
  const combinedProgress = progress ? {
    found: progress.lyrics.progress.found + progress.title.progress.found + progress.artist.progress.found,
    total: progress.lyrics.progress.total + progress.title.progress.total + progress.artist.progress.total,
  } : { found: 0, total: 0 };
  const revealedPct = combinedProgress.total > 0
    ? Math.round((combinedProgress.found / combinedProgress.total) * 100)
    : 0;

  // `attempts` counts every guess, misses included - it used to count only the
  // valid ones, which quietly hid every wrong answer from the final tally.
  const attempts = gameState?.guesses.length ?? 0;
  const hits = overallSegments.length;

  const winSong = gameState?.song && {
    title: gameState.song.title,
    artist: gameState.song.artist,
    spotifyId: gameState.song.spotifyId,
    geniusUrl: gameState.song.geniusData?.url,
  };

  const rail = (
    <>
      <div className="px-5 py-[18px]">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <span className="block w-24 h-[22px] rounded-[5px] bg-rtfl-raised animate-rtfl-breathe" />
            <span className="block w-full h-2 rounded-full bg-rtfl-raised animate-rtfl-breathe" style={{ animationDelay: '80ms' }} />
          </div>
        ) : (
          <PathToVictory
            progress={combinedProgress}
            segments={combinedSegments}
            isGameWon={isGameWon}
            highlightedWord={activeWord}
            onHoverWord={handleWordHover}
            onSelectWord={handleGuessSelect}
          />
        )}
      </div>

      {/* No rules above or below: the input is the one thing on this rail that
          is always in use, and boxing it in made it read as a separate panel.
          The feedback row GuessInput reserves is what made the padding look
          lopsided, so the bottom padding is trimmed by its height. */}
      <div className="px-5 pt-[18px] pb-1 flex flex-col gap-2">
        {!hasGuessed && (
          <p className="m-0 font-sans text-[12px] leading-[1.5] text-rtfl-ink-2">
            Guess any word. Every match reveals it everywhere in the song.
          </p>
        )}
        <GuessInput
          onGuessSubmit={handleGuessSubmit}
          pendingGuess={pendingGuess}
          disabled={revealed || isLoading}
          placeholder={revealed ? 'come back tomorrow' : 'Type your guess...'}
          onDuplicateGuess={handleDuplicateGuess}
        />
      </div>

      <div className="px-5 py-[18px] flex-1 min-h-0 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-wrap gap-[6px]">
            {[62, 48, 74, 55].map((w, i) => (
              <span
                key={i}
                style={{ width: w, animationDelay: `${200 + i * 60}ms` }}
                className="h-[26px] rounded-[7px] bg-rtfl-raised animate-rtfl-breathe"
              />
            ))}
          </div>
        ) : (
          <GuessHistory
            guesses={gameState.guesses}
            maskedTitleParts={gameState.masked.title}
            maskedArtistParts={gameState.masked.artist}
            maskedLyricsParts={gameState.masked.lyrics}
            onWordHover={handleWordHover}
            selectedGuess={selectedGuess}
            onGuessSelect={handleGuessSelect}
          />
        )}
      </div>

      {/* Sharing isn't only for the end: a stuck player asking for help is the
          other half of it, and the card reframes itself for that. Once won,
          the summary carries its own button and this one would be a second. */}
      {!isLoading && !isGameWon && hasGuessed && (
        <div className="px-5 pb-[18px]">
          <ShareButton
            lyricsPercent={revealedPct}
            attempts={attempts}
            hits={hits}
            segments={combinedSegments}
            total={combinedProgress.total}
            date={date}
            dayNumber={dayNumber}
          />
        </div>
      )}

      {revealed && gameState?.song && (
        <div className="px-5 py-[18px] border-t border-rtfl-line-soft flex flex-col gap-3 animate-rtfl-rise">
          <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-rtfl-ink-2">now playing</span>
          <div className="flex items-center gap-3 p-3 border border-rtfl-line rounded-[10px] bg-rtfl-bg">
            <span className="w-[42px] h-[42px] rounded-[6px] bg-rtfl-raised flex items-center justify-center text-rtfl-ink-2 text-[15px]">▶</span>
            <span className="flex flex-col gap-[3px] min-w-0">
              <span className="font-sans text-[13px] text-rtfl-ink truncate">{gameState.song.title}</span>
              <span className="font-sans text-[11px] text-rtfl-ink-2 truncate">{gameState.song.artist}</span>
            </span>
          </div>
        </div>
      )}

      {/* Guarded on a real, actually-played date: otherwise "yesterday" is
          derived from a day that has no game, firing a doomed stats request. */}
      {revealed && !isFallback && isValidDate(date) && (
        <div className="px-5 pb-[18px] animate-rtfl-rise">
          <YesterdayStats currentDate={date} />
        </div>
      )}

      {playerId && (
        <div className="px-5 py-[10px] border-t border-rtfl-line-soft mt-auto">
          <PlayerIdBadge playerId={playerId} className="text-[10px]" />
        </div>
      )}
    </>
  );

  return (
    // h-full, not h-screen: the page owns the viewport lock, so a route can
    // put something (the fallback banner) above the game without pushing it
    // off-screen.
    <div data-testid="game-container" className="h-full overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex flex-col items-center max-sm:items-stretch">
      <div className="w-full max-w-[1320px] border border-rtfl-line rounded-[14px] max-sm:rounded-none max-sm:border-none flex flex-col overflow-hidden m-6 max-sm:m-0 flex-1 min-h-0">
        <header data-testid="game-header" className="flex items-end gap-6 px-6 py-[18px] max-sm:px-5 max-sm:py-[12px] max-sm:pb-3 border-b border-rtfl-line-soft bg-rtfl-surface">
          <div className="flex flex-col gap-[6px] max-sm:gap-[3px]">
            <ScrambleTitle />
            {isLoading ? (
              <span className="font-sans text-[12px] max-sm:text-[11px] text-rtfl-ink-2">loading today&apos;s song</span>
            ) : (
              <Link
                href="/archive"
                data-testid="date-display"
                title={isFallback ? 'back to the archive' : date}
                className="font-sans text-[12px] max-sm:text-[11px] text-rtfl-ink-2 hover:text-rtfl-ink inline-flex items-center gap-[6px] w-fit leading-none"
              >
                {/* The triangle is drawn small and high inside its own em box,
                    so matching font sizes still leaves it riding above the
                    text. Shrinking it lets items-center do the rest. */}
                <span className="text-rtfl-ink-3 text-[8px] leading-none">◀</span>
                <span className="leading-none">{isFallback ? 'archive' : `day ${dayNumber}`}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Desktop: two-column body */}
        <div className="hidden lg:grid grid-cols-[328px_1fr] flex-1 min-h-0">
          <div className="border-r border-rtfl-line-soft bg-rtfl-surface flex flex-col overflow-y-auto min-h-0">
            {rail}
          </div>

          <div className="flex flex-col min-w-0 min-h-0">
            <div className="px-[56px] pt-10 pb-[26px] border-b border-rtfl-line-soft">
              {isLoading ? (
                <div className="flex flex-col gap-[10px]">
                  <div className="flex gap-[0.42em] font-mono text-[30px]">
                    <span className="block w-[7ch] h-[30px] rounded-[5px] bg-rtfl-raised animate-rtfl-breathe" />
                    <span className="block w-[4ch] h-[30px] rounded-[5px] bg-rtfl-raised animate-rtfl-breathe" style={{ animationDelay: '90ms' }} />
                  </div>
                  <div className="flex gap-[0.42em] font-mono text-[15px]">
                    <span className="block w-[3ch] h-[15px] rounded-[4px] bg-rtfl-raised animate-rtfl-breathe" style={{ animationDelay: '140ms' }} />
                    <span className="block w-[6ch] h-[15px] rounded-[4px] bg-rtfl-raised animate-rtfl-breathe" style={{ animationDelay: '190ms' }} />
                  </div>
                </div>
              ) : (
                <MaskedTitleArtist
                  maskedTitleParts={gameState.masked.title}
                  maskedArtistParts={gameState.masked.artist}
                  highlightedWord={activeWord}
                  guesses={gameState.guesses}
                  revealed={revealed}
                  justWon={justWon}
                />
              )}
            </div>
            {/* This pane is the lyrics surface: the title and artist live in
                their own non-scrolling block above it. */}
            {/* The fog sits on this wrapper, not inside the scroller: an
                absolute child of a scrolling box anchors to the content, so
                `bottom-0` rode away with the lyrics instead of staying at the
                edge of the visible pane. */}
            <div className="relative flex-1 min-h-0">
              <div ref={desktopScrollRef} data-testid="masked-lyrics" className="h-full overflow-y-auto px-[56px] pt-[34px] pb-[44px]">
                {isLoading ? (
                  <LyricsLoadingComponent />
                ) : (
                  <MaskedLyricsBody
                    maskedLyricsParts={gameState.masked.lyrics}
                    highlightedWord={activeWord}
                    scrollToWord={scrollToWord}
                    scrollTick={scrollTick}
                    scrollContainerRef={desktopScrollRef}
                    guesses={gameState.guesses}
                    revealed={revealed}
                    justWon={justWon}
                  />
                )}
              </div>
              <div className={cn("absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-rtfl-bg to-transparent pointer-events-none transition-opacity duration-300", showTopFog ? "opacity-100" : "opacity-0")} />
              <div className={cn("absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-rtfl-bg to-transparent pointer-events-none transition-opacity duration-300", showBottomFog ? "opacity-100" : "opacity-0")} />
            </div>

            {isGameWon && (
              <WinSummary
                lyricsPercent={revealedPct}
                attempts={attempts}
                hits={hits}
                segments={combinedSegments}
                total={combinedProgress.total}
                date={date}
                dayNumber={dayNumber}
                song={winSong}
              />
            )}
          </div>
        </div>

        {/* Mobile: stacked, pinned bottom bar */}
        <div className="flex lg:hidden flex-col flex-1 min-h-0">
          <div className="px-5 py-3 border-b border-rtfl-line-soft flex flex-col gap-2">
            {!isLoading && (
              <PathToVictory
                progress={combinedProgress}
                segments={combinedSegments}
                isGameWon={isGameWon}
                highlightedWord={activeWord}
                onHoverWord={handleWordHover}
                onSelectWord={handleGuessSelect}
              />
            )}
          </div>

          {/* Title and artist sit outside the scrolling pane, as they do on
              desktop, so they stay on screen while the lyrics scroll. */}
          {!isLoading && (
            <div className="px-5 pt-[14px] pb-3 border-b border-rtfl-line-soft bg-rtfl-bg">
              <MaskedTitleArtist
                maskedTitleParts={gameState.masked.title}
                maskedArtistParts={gameState.masked.artist}
                highlightedWord={activeWord}
                guesses={gameState.guesses}
                revealed={revealed}
                justWon={justWon}
              />
            </div>
          )}

          <div ref={mobileScrollRef} data-testid="masked-lyrics" className="relative flex-1 overflow-y-auto px-5 pt-[22px] pb-[26px] flex flex-col gap-5">
            {isLoading ? (
              <LyricsLoadingComponent />
            ) : (
              <MaskedLyricsBody
                maskedLyricsParts={gameState.masked.lyrics}
                highlightedWord={activeWord}
                scrollToWord={scrollToWord}
                scrollTick={scrollTick}
                scrollContainerRef={mobileScrollRef}
                guesses={gameState.guesses}
                revealed={revealed}
                justWon={justWon}
              />
            )}
          </div>

          {isGameWon && (
            <WinSummary
              compact
              lyricsPercent={revealedPct}
              attempts={attempts}
              hits={hits}
              segments={combinedSegments}
              total={combinedProgress.total}
              date={date}
              dayNumber={dayNumber}
              song={winSong}
            />
          )}

          {/* No rule on top: the surface colour already separates this bar
              from the lyrics. The extra bottom padding was a fixed guess at
              the home indicator; env() asks the device, so the bar is evenly
              padded on the ones that do not have one. */}
          <div className="bg-rtfl-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-[10px]">
            <div className="flex gap-[6px] overflow-x-auto min-h-[28px] items-center">
              {!hasGuessed && (
                <span className="font-sans text-[11.5px] text-rtfl-ink-3 whitespace-nowrap">
                  Guess any word — matches light up everywhere.
                </span>
              )}
              {[...allGuessHits].reverse().slice(0, 6).map(g => {
                const color = getWordColorDeterministic(g.word);
                const isSelected = selectedGuess?.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => g.valid && handleGuessSelect({ id: g.id, word: g.word })}
                    className="inline-flex items-baseline gap-[5px] px-[10px] py-[5px] rounded-[7px] font-mono text-[12.5px] whitespace-nowrap"
                    style={{
                      background: !g.valid
                        ? 'rgba(255,255,255,.028)'
                        : isSelected
                          ? `${color}2e`
                          : 'rgba(255,255,255,.045)',
                      color: g.valid ? color : '#7a818d',
                      textDecoration: g.valid ? 'none' : 'line-through',
                      boxShadow: g.valid && isSelected ? `inset 0 0 0 1px ${color}80` : 'none',
                    }}
                  >
                    <span>{g.word}</span>
                    {g.valid && g.hits > 0 && (
                      <span style={{ opacity: 0.72 }} className="text-[10.5px]">×{g.hits}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <GuessInput
              onGuessSubmit={handleGuessSubmit}
              pendingGuess={pendingGuess}
              disabled={revealed || isLoading}
              placeholder={revealed ? 'come back tomorrow' : 'Type your guess...'}
              inlineFeedback
              onDuplicateGuess={handleDuplicateGuess}
            />
            {playerId && <PlayerIdBadge playerId={playerId} className="text-[9.5px]" />}
          </div>
        </div>
      </div>
    </div>
  );
}
