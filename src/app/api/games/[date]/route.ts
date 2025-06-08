import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import type { GameState } from '@/app/api/lib/types/game-state';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

type ErrorResponse = { error: string };
type SuccessResponse<T> = T;
type GetResponse = SuccessResponse<GameState & { stats?: GameStats }> | ErrorResponse;

interface GameStats {
  totalPlayers: number;
  averageGuesses: number;
  totalValidGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
}

export const GET = async (request: NextRequest, context: { params: { date: string } }) => {
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { date } = await params;
    const validatedDate = validateSchema(schemas.date, date);
    // Prevent accessing future games
    const today = new Date().toISOString().split('T')[0];
    if (validatedDate > today) {
      return NextResponse.json(
        { error: 'Cannot access games in the future' },
        { status: 403 }
      );
    }
    const userId = request.headers.get('x-user-id')!;
    const gameStateService = createGameStateService(prisma);
    const result = await gameStateService.getGameState(validatedDate, userId);
    // Calculate stats
    const game = await prisma.game.findUnique({
      where: { date: validatedDate },
      include: {
        song: true,
        guesses: {
          select: {
            playerId: true,
            valid: true,
            createdAt: true,
            word: true
          }
        }
      }
    });
    if (game) {
      const totalPlayers = new Set(game.guesses.map(g => g.playerId)).size;
      const validGuesses = game.guesses.filter(g => g.valid);
      const totalValidGuesses = validGuesses.length;
      const averageGuesses = totalPlayers > 0 ? Math.round(totalValidGuesses / totalPlayers) : 0;
      // Calculate lyrics completion for winners
      const maskedLyrics = game.song.maskedLyrics;
      const maskedWords = Array.isArray(maskedLyrics)
        ? maskedLyrics.filter((t: any) => t.isToGuess).map((t: any) => t.value.toLowerCase())
        : [];
      const totalMaskedWords = maskedWords.length;
      // Group valid guesses by player
      const playerGuesses: Record<string, Set<string>> = {};
      for (const g of validGuesses) {
        if (!playerGuesses[g.playerId]) playerGuesses[g.playerId] = new Set();
        playerGuesses[g.playerId].add(g.word.toLowerCase());
      }
      // Find players who found all masked words
      const winners = Object.entries(playerGuesses).filter(([_playerId, words]) =>
        maskedWords.every(w => words.has(w))
      );
      // Calculate completion percentage for winners
      const winnerCompletions = winners.map(([_playerId, words]) =>
        totalMaskedWords > 0 ? Math.round((Array.from(words).filter(w => maskedWords.includes(w)).length / totalMaskedWords) * 100) : 0
      );
      const averageLyricsCompletionForWinners = winnerCompletions.length > 0
        ? Math.round(winnerCompletions.reduce((a, b) => a + b, 0) / winnerCompletions.length)
        : 0;
      // Calculate difficulty score
      let difficultyScore = 5;
      if (totalMaskedWords > 0) {
        difficultyScore = Math.max(1, Math.min(10, Math.round((averageGuesses / totalMaskedWords) * 10)));
      }
      const stats: GameStats = {
        totalPlayers,
        averageGuesses,
        totalValidGuesses,
        averageLyricsCompletionForWinners,
        difficultyScore
      };
      return NextResponse.json({ ...result, stats });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}; 