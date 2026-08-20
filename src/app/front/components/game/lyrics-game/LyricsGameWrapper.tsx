"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LyricsGame } from './LyricsGame';
import { useGameLogic } from '@/app/front/hooks/useGameLogic';
import { getOrCreatePlayerId } from '@/app/front/lib/utils';
import type { GameLogicProps } from '@/app/types';

interface LyricsGameWrapperProps {
  date: string;
}

const RETRY_DELAY_SECONDS = 4;

function FailedToLoad({ onRetry }: { onRetry: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(RETRY_DELAY_SECONDS);

  useEffect(() => {
    setSecondsLeft(RETRY_DELAY_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          onRetry();
          return RETRY_DELAY_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-rtfl-bg text-rtfl-ink font-mono flex items-center justify-center px-10">
      <div className="border border-rtfl-line rounded-[14px] max-w-[1000px] min-h-[560px] w-full flex flex-col items-center justify-center gap-[22px] px-10 py-[60px]">
        <span
          className="w-[46px] h-[46px] rounded-[12px] border flex items-center justify-center text-[19px]"
          style={{ background: 'rgba(255,176,163,0.08)', borderColor: '#4a2f33', color: 'var(--rtfl-error)' }}
        >
          !
        </span>
        <div className="flex flex-col gap-[9px] items-center">
          <h2 className="m-0 font-mono font-bold text-[19px]">Today&apos;s song didn&apos;t load</h2>
          <p className="m-0 font-sans text-[14px] text-rtfl-ink-2 text-center max-w-[400px] leading-[1.6]">
            The lyrics service isn&apos;t answering. Your guesses are saved — nothing is lost.
          </p>
        </div>
        <div className="flex gap-[10px] flex-wrap justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-accent-line bg-rtfl-accent-bg text-rtfl-accent-ink font-sans text-[13px]"
          >
            Try again
          </button>
          <Link href="/archive" className="px-[18px] py-[11px] rounded-[9px] border border-rtfl-line text-rtfl-ink-2 font-sans text-[13px]">
            Play an older song
          </Link>
        </div>
        <span className="font-mono text-[11px] text-rtfl-ink-3">
          error 503 · retrying in {secondsLeft}s
        </span>
      </div>
    </div>
  );
}

export function LyricsGameWrapper({ date }: LyricsGameWrapperProps) {
  const [playerId, setPlayerId] = useState<string>('');

  const gameLogic = useGameLogic({ date } as GameLogicProps);

  const {
    currentGame,
    gameError,
    refetchGame,
    handleGuess,
  } = gameLogic;

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  if (gameError) {
    return <FailedToLoad onRetry={() => refetchGame()} />;
  }

  return (
    <div className="h-screen overflow-hidden">
      <LyricsGame
        gameState={currentGame ?? null}
        onGuess={handleGuess}
        date={date}
        playerId={playerId}
      />
    </div>
  );
}
