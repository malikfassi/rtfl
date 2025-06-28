"use client";

import React, { useState, useEffect } from "react";
import { GameContainer } from "./lyrics-game/GameContainer";
import { GameHeader } from "./lyrics-game/GameHeader";
import { GameContent } from "./lyrics-game/GameContent";
import { GameSidebar } from "./lyrics-game/GameSidebar";
import { ShareModal } from './lyrics-game/ShareModal';
import { useGameLogic } from '@/app/front/hooks/useGameLogic';
import { GameControls } from './lyrics-game/GameControls';
import { getOrCreatePlayerId } from '@/app/front/lib/helpers/player';
import { gameColors } from "@/app/front/lib/utils/color-management";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import type { GameState } from "@/app/types";

interface LyricsGameProps {
  date: string;
  game?: GameState;
  disabled?: boolean;
  isAdmin?: boolean;
  onChooseSong?: () => void;
  hideChooseSongButton?: boolean;
}

export function LyricsGame(props: LyricsGameProps) {
  const { date, isAdmin = false, onChooseSong, hideChooseSongButton = false } = props;
  
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<{ id: string; word: string } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const id = getOrCreatePlayerId();
    if (id) {
      setPlayerId(id);
    }
  }, []);

  const {
    currentGame,
    isGameLoading,
    gameError: useGameLogicGameError,
    isGameComplete,
    lyricsProgressData,
    titleProgressData,
    artistProgressData,
    foundWords,
    maskedTitle,
    maskedArtist,
    maskedLyrics,
    maskedTitleParts,
    maskedArtistParts,
    maskedLyricsParts,
    shareText,
    gameUrl,
    handleGuess
  } = useGameLogic({
    date
  });

  if (!isClient || !playerId) {
    return <LoadingState message="Loading..." />;
  }

  if (isGameLoading) {
    return <LoadingState message="Loading game..." />;
  }

  if (useGameLogicGameError) {
    return (
      <ErrorState
        title="Failed to load game"
        message={useGameLogicGameError.message || "An error occurred while loading the game"}
        onRetry={() => {
          // Reset error state and retry loading
          window.location.reload();
        }}
      />
    );
  }

  if (!currentGame) {
    return (
      <ErrorState
        title="Game not found"
        message="The requested game could not be found"
      />
    );
  }

  const onGuess = async (guess: string) => {
    await handleGuess(guess);
    const lastValid = (currentGame?.guesses ?? []).filter((g: { valid: boolean }) => g.valid).slice(-1)[0];
    if (lastValid) setSelectedGuess({ id: lastValid.id, word: lastValid.word });
  };

  return (
    <GameContainer>
      <div className="space-y-8">
        <GameHeader
          title={maskedTitle}
          date={date}
          playerId={playerId}
          isAdmin={isAdmin}
          onChooseSong={onChooseSong}
          hideChooseSongButton={hideChooseSongButton}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Controls */}
          <div className="order-1 lg:order-1">
            <div className="sticky top-8">
              <GameControls
                playerId={playerId}
                date={date}
                isGameComplete={isGameComplete}
                guesses={currentGame.guesses}
                maskedLyrics={maskedLyrics}
                maskedTitle={maskedTitle}
                maskedArtist={maskedArtist}
                maskedTitleParts={maskedTitleParts}
                maskedArtistParts={maskedArtistParts}
                maskedLyricsParts={maskedLyricsParts}
                onGuess={onGuess}
                isSubmitting={false}
                onWordHover={setHoveredWord}
                selectedGuess={selectedGuess}
                onGuessSelect={setSelectedGuess}
                colors={gameColors}
              />
            </div>
          </div>

          {/* Center Column - Lyrics */}
          <div className="order-2 lg:order-2 lg:col-span-2">
            <GameContent
              title={maskedTitle}
              artist={maskedArtist}
              lyrics={maskedLyrics}
              maskedTitleParts={maskedTitleParts}
              maskedArtistParts={maskedArtistParts}
              maskedLyricsParts={maskedLyricsParts}
              isComplete={isGameComplete}
              foundWords={foundWords}
              hoveredWord={hoveredWord}
              selectedWord={selectedGuess?.word}
              guesses={currentGame.guesses}
              colors={gameColors}
              song={null}
              isAdmin={isAdmin}
            />
          </div>

          {/* Right Column - Progress & Stats */}
          <div className="order-3 lg:order-3">
            <GameSidebar
              progressProps={{
                lyricsFound: lyricsProgressData.found,
                lyricsTotal: lyricsProgressData.total,
                titleFound: titleProgressData.found,
                titleTotal: titleProgressData.total,
                artistFound: artistProgressData.found,
                artistTotal: artistProgressData.total,
                lyricsWin: lyricsProgressData.total > 0 && lyricsProgressData.found / lyricsProgressData.total >= 0.8,
                titleWin: titleProgressData.total > 0 && titleProgressData.found === titleProgressData.total,
                artistWin: artistProgressData.total > 0 && artistProgressData.found === artistProgressData.total,
              }}
              yesterdayStatsProps={{
                currentDate: date,
              }}
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full px-4 py-3 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info rounded-lg transition-colors font-medium"
          >
            Share
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareText={shareText}
        gameUrl={gameUrl}
      />
    </GameContainer>
  );
} 