"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ScrambleTitle } from '../ScrambleTitle';
import { YesterdayStats } from '../YesterdayStats';
import { GuessHistory, GuessInput, MaskedLyricsDisplay, MaskedTitleArtist, MaskedLyricsBody, PathToVictory, ShareButton, LyricsLoadingComponent } from './index';
import { calculateGuessHits, countTotalHits } from '@/app/front/lib/utils/hit-counting';
import { getWordColorDeterministic } from '@/app/front/lib/utils/color-management';
import { calculateGameProgress } from '@/app/front/lib/utils/progress-calculations';
import { getDayNumber, isValidDate } from '@/app/front/lib/utils/date-formatting';
import { cn } from '@/app/front/lib/utils';
import type { LyricsGameProps } from './types';

type SelectedGuess = { id: string; word: string } | null;

export function LyricsGame({ gameState, onGuess, date }: LyricsGameProps) {
  const [selectedGuess, setSelectedGuess] = useState<SelectedGuess>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [scrollToWord, setScrollToWord] = useState<string | null>(null);
  // Bumped alongside scrollToWord so selecting the same word twice still
  // scrolls - the word alone is an unchanged dependency the second time.
  const [scrollTick, setScrollTick] = useState(0);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  // Owned here rather than inside PathToVictory: that component unmounts
  // whenever a refetch briefly drops gameState, which would silently close
  // the panel the player just opened.
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [showTopFog, setShowTopFog] = useState(false);
  const [showBottomFog, setShowBottomFog] = useState(false);

  // The desktop and mobile layouts are both mounted at all times (one is
  // hidden by a `lg:` class), so they need separate refs - sharing one meant
  // the second element to mount silently overwrote the first, pointing the
  // fog listener and scroll-to-word at the hidden pane.
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = desktopScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      setShowTopFog(scrollTop > 0);
      setShowBottomFog(scrollTop < scrollHeight - clientHeight - 1);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    const mutationObserver = new MutationObserver(handleScroll);
    mutationObserver.observe(scrollContainer, { childList: true, subtree: true, characterData: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      mutationObserver.disconnect();
    };
  }, []);

  // Esc releases the locked highlight, from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGuess(null);
        setHighlightedWord(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleWordHover = (word: string | null) => setHighlightedWord(word);

  const handleGuessSelect = (guess: SelectedGuess) => {
    setSelectedGuess(guess);
    setScrollToWord(guess?.word ?? null);
    if (guess) setScrollTick(t => t + 1);
    if (!guess) setHighlightedWord(null);
  };

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
        setSelectedGuess({ id: submittedGuess.id, word: submittedGuess.word });
        setScrollToWord(submittedGuess.word);
        setScrollTick(t => t + 1);
        setHighlightedWord(submittedGuess.word);
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
      setSelectedGuess({ id: existingGuess.id, word: existingGuess.word });
      setScrollToWord(existingGuess.word);
      setScrollTick(t => t + 1);
      setHighlightedWord(existingGuess.word);
    }
  };

  const isLoading = !gameState;
  const revealed = !!gameState?.song; // gameState.song presence IS the win state
  const hasGuessed = (gameState?.guesses.length ?? 0) > 0;
  const activeWord = selectedGuess?.word ?? highlightedWord;
  const dayNumber = getDayNumber(date);

  const [nextGameTimer, setNextGameTimer] = useState('00:00:00');
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setNextGameTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const validGuesses = gameState?.guesses.filter(g => g.valid) ?? [];
  const foundWordsAll = Array.from(new Set(validGuesses.map(g => g.word.toLowerCase())));

  const progress = gameState ? calculateGameProgress({
    foundWords: foundWordsAll,
    maskedLyricsParts: gameState.masked.lyrics,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }) : null;

  const lyricsSegments = gameState ? calculateGuessHits({
    guesses: validGuesses,
    maskedLyricsParts: gameState.masked.lyrics,
  }).filter(g => g.hits > 0).map(g => ({ id: g.id, word: g.word, hits: g.hits })) : [];

  const creditsSegments = gameState ? calculateGuessHits({
    guesses: validGuesses,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }).filter(g => g.hits > 0).map(g => ({ id: g.id, word: g.word, hits: g.hits })) : [];

  // Every guess with its hit count, misses included - the mobile chip row
  // needs the zero-hit ones too, so this can't be filtered like the bars.
  const allGuessHits = gameState ? calculateGuessHits({
    guesses: gameState.guesses,
    maskedLyricsParts: gameState.masked.lyrics,
    maskedTitleParts: gameState.masked.title,
    maskedArtistParts: gameState.masked.artist,
  }) : [];

  const overallSegments = allGuessHits
    .filter(g => g.valid && g.hits > 0)
    .map(g => ({ id: g.id, word: g.word, hits: g.hits }));

  const lyricsPct = progress?.lyrics.percent ?? 0;
  const lyricsWin = !!progress && progress.lyrics.progress.total > 0 && progress.lyrics.progress.found / progress.lyrics.progress.total >= 0.8;
  const titleWin = !!progress && progress.title.progress.total > 0 && progress.title.progress.found === progress.title.progress.total;
  const artistWin = !!progress && progress.artist.progress.total > 0 && progress.artist.progress.found === progress.artist.progress.total;
  const creditsWin = titleWin && artistWin;
  const winStamp = revealed ? (lyricsWin && creditsWin ? 'won on both' : lyricsWin ? 'won on the lyrics' : 'won on the credits') : null;

  const wordsFound = overallSegments.length;
  const guessesUsed = validGuesses.length;
  const bestWordHits = overallSegments.reduce((max, s) => Math.max(max, s.hits), 0);

  const rail = (
    <>
      <div className="px-5 py-[18px] border-b border-rtfl-line-soft">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <span className="block w-24 h-[22px] rounded-[5px] bg-rtfl-raised animate-rtfl-breathe" />
            <span className="block w-full h-2 rounded-full bg-rtfl-raised animate-rtfl-breathe" style={{ animationDelay: '80ms' }} />
          </div>
        ) : (
          <PathToVictory
            lyricsProgress={progress!.lyrics.progress}
            titleProgress={progress!.title.progress}
            artistProgress={progress!.artist.progress}
            lyricsSegments={lyricsSegments}
            creditsSegments={creditsSegments}
            highlightedWord={activeWord}
            onHoverWord={handleWordHover}
            onSelectWord={handleGuessSelect}
            victoryOpen={victoryOpen}
            onToggleVictory={() => setVictoryOpen(v => !v)}
          />
        )}
      </div>

      <div className="px-5 py-[18px] border-b border-rtfl-line-soft flex flex-col gap-2">
        {!hasGuessed && (
          <p className="m-0 font-sans text-[12px] leading-[1.5] text-rtfl-ink-2">
            Guess any word. Every match reveals it everywhere in the song.
          </p>
        )}
        <GuessInput
          onGuessSubmit={handleGuessSubmit}
          pendingGuess={pendingGuess}
          disabled={revealed || isLoading}
          placeholder={revealed ? 'solved for today' : 'Type your guess...'}
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

      {/* Guarded on a real date: the rickroll route passes the literal
          "rickroll", which would derive a NaN "yesterday" and fire a doomed
          stats request. */}
      {revealed && isValidDate(date) && (
        <div className="px-5 pb-[18px] animate-rtfl-rise">
          <YesterdayStats currentDate={date} />
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex flex-col items-center max-sm:items-stretch">
      <div className="w-full max-w-[1320px] border border-rtfl-line rounded-[14px] max-sm:rounded-none max-sm:border-none flex flex-col overflow-hidden m-6 max-sm:m-0 flex-1 min-h-0">
        <header className="flex items-end justify-between gap-6 px-6 py-[18px] max-sm:px-5 max-sm:py-[12px] max-sm:pb-3 border-b border-rtfl-line-soft bg-rtfl-surface">
          <div className="flex flex-col gap-[6px] max-sm:gap-[3px]">
            <ScrambleTitle />
            {isLoading ? (
              <span className="font-sans text-[12px] max-sm:text-[11px] text-rtfl-ink-2">loading today&apos;s song</span>
            ) : (
              <>
                <div className="flex items-center gap-[14px] max-sm:hidden">
                  <Link href="/archive" className="font-sans text-[12px] text-rtfl-ink-2 hover:text-rtfl-ink flex items-center gap-[6px]">
                    <span className="text-rtfl-ink-3">◀</span>{date}
                  </Link>
                  <span className="font-sans text-[12px] text-rtfl-ink-3">day {dayNumber}</span>
                </div>
                <Link href="/archive" className="hidden max-sm:block font-sans text-[11px] text-rtfl-ink-3">
                  {date} · day {dayNumber}
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 max-sm:flex-row max-sm:items-baseline max-sm:gap-2">
            <span className="max-sm:hidden font-sans text-[10px] tracking-[0.16em] uppercase text-rtfl-ink-3">next song</span>
            <span className="font-mono text-[17px] max-sm:text-[12px] font-medium text-rtfl-accent tabular-nums">{nextGameTimer}</span>
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
                />
              )}
            </div>
            <div ref={desktopScrollRef} className="relative flex-1 overflow-y-auto px-[56px] pt-[34px] pb-[44px]">
              <div className={cn("absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-rtfl-bg to-transparent pointer-events-none transition-opacity duration-300", showTopFog ? "opacity-100" : "opacity-0")} />
              <div className={cn("absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-rtfl-bg to-transparent pointer-events-none transition-opacity duration-300", showBottomFog ? "opacity-100" : "opacity-0")} />
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
                />
              )}
            </div>

            {revealed && winStamp && (
              <div className="border-t border-rtfl-line-soft bg-rtfl-surface px-[56px] py-[22px] flex items-end justify-between gap-8 flex-wrap animate-rtfl-rise">
                <div className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] text-rtfl-hit">✓ {winStamp}</span>
                  <div className="flex gap-10">
                    <span className="flex flex-col gap-[5px]">
                      <span className="font-mono font-bold text-[26px] tabular-nums text-rtfl-hit">{wordsFound}</span>
                      <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-rtfl-ink-2">you found</span>
                    </span>
                    <span className="flex flex-col gap-[5px]">
                      <span className="font-mono font-bold text-[26px] tabular-nums">{guessesUsed}</span>
                      <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-rtfl-ink-2">guesses used</span>
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-rtfl-ink-3">dimmed words came with the win</span>
                </div>
                <ShareButton
                  wordsFound={wordsFound}
                  guessesUsed={guessesUsed}
                  bestWordHits={bestWordHits}
                  overallPercent={lyricsPct}
                  segments={lyricsSegments}
                  total={progress?.lyrics.progress.total ?? 0}
                  date={date}
                  dayNumber={dayNumber}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile: stacked, pinned bottom bar */}
        <div className="flex lg:hidden flex-col flex-1 min-h-0">
          <div className="px-5 py-3 border-b border-rtfl-line-soft flex flex-col gap-2">
            {!isLoading && (
              <PathToVictory
                lyricsProgress={progress!.lyrics.progress}
                titleProgress={progress!.title.progress}
                artistProgress={progress!.artist.progress}
                lyricsSegments={lyricsSegments}
                creditsSegments={creditsSegments}
                highlightedWord={activeWord}
                onHoverWord={handleWordHover}
                onSelectWord={handleGuessSelect}
                victoryOpen={victoryOpen}
                onToggleVictory={() => setVictoryOpen(v => !v)}
              />
            )}
          </div>

          <div ref={mobileScrollRef} className="relative flex-1 overflow-y-auto px-5 pt-[22px] pb-[26px] flex flex-col gap-5">
            {isLoading ? (
              <LyricsLoadingComponent />
            ) : (
              <MaskedLyricsDisplay
                maskedTitleParts={gameState.masked.title}
                maskedArtistParts={gameState.masked.artist}
                maskedLyricsParts={gameState.masked.lyrics}
                highlightedWord={activeWord}
                scrollToWord={scrollToWord}
                scrollTick={scrollTick}
                scrollContainerRef={mobileScrollRef}
                guesses={gameState.guesses}
                revealed={revealed}
              />
            )}
          </div>

          {revealed && winStamp && (
            <div className="border-t border-rtfl-line-soft bg-rtfl-surface px-5 py-4 flex flex-col gap-[14px] animate-rtfl-rise">
              <span className="font-sans text-[12px] text-rtfl-hit">✓ {winStamp}</span>
              <div className="flex justify-between gap-3">
                <span className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-[20px] tabular-nums text-rtfl-hit">{wordsFound}</span>
                  <span className="font-sans text-[9.5px] uppercase tracking-[0.12em] text-rtfl-ink-2">found</span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-[20px] tabular-nums">{guessesUsed}</span>
                  <span className="font-sans text-[9.5px] uppercase tracking-[0.12em] text-rtfl-ink-2">guesses</span>
                </span>
              </div>
              {gameState?.song && (
                <div className="flex items-center gap-[11px] p-3 border border-rtfl-line rounded-[10px] bg-rtfl-bg">
                  <span className="w-[38px] h-[38px] rounded-[6px] bg-rtfl-raised flex items-center justify-center text-rtfl-ink-2 text-[14px] shrink-0">▶</span>
                  <span className="flex flex-col gap-[3px] min-w-0 flex-1">
                    <span className="font-sans text-[13px] text-rtfl-ink truncate">{gameState.song.title}</span>
                    <span className="font-sans text-[11px] text-rtfl-ink-2 truncate">{gameState.song.artist}</span>
                  </span>
                </div>
              )}
              <ShareButton
                wordsFound={wordsFound}
                guessesUsed={guessesUsed}
                bestWordHits={bestWordHits}
                overallPercent={lyricsPct}
                segments={lyricsSegments}
                total={progress?.lyrics.progress.total ?? 0}
                date={date}
                dayNumber={dayNumber}
              />
            </div>
          )}

          <div className="border-t border-rtfl-line-soft bg-rtfl-surface px-4 pt-3 pb-[22px] flex flex-col gap-[10px]">
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
                    onClick={() => g.valid && handleGuessSelect(isSelected ? null : { id: g.id, word: g.word })}
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
              placeholder={revealed ? 'solved for today' : 'Type your guess...'}
              inlineFeedback
              onDuplicateGuess={handleDuplicateGuess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
