import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { createGameStateService } from '@/app/api/lib/services/game-state';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { createMaskedLyricsService } from '@/app/api/lib/services/masked-lyrics';
import type { MaskedLyrics } from '@/app/types/game';
import type { Token } from '@/app/types/common';
import { Prisma } from '@prisma/client';


interface GameStats {
  totalPlayers: number;
  averageGuesses: number;
  totalValidGuesses: number;
  averageLyricsCompletionForWinners: number;
  difficultyScore: number;
  wins: number;
}

const createRickrollGame = async (prisma: PrismaClient) => {
  const rickrollDate = '2099-12-31';
  
  // Check if the game already exists
  let game = await prisma.game.findUnique({ where: { date: rickrollDate }, include: { song: true } });
  if (!game) {
    // Load data from fixtures
    const lyricsPath = path.join(process.cwd(), 'src/app/api/lib/test/fixtures/data/genius/lyrics/NEVER_GONNA_GIVE_YOU_UP.txt');
    const spotifyPath = path.join(process.cwd(), 'src/app/api/lib/test/fixtures/data/spotify/tracks/NEVER_GONNA_GIVE_YOU_UP.json');
    const geniusPath = path.join(process.cwd(), 'src/app/api/lib/test/fixtures/data/genius/search/NEVER_GONNA_GIVE_YOU_UP.json');
    
    const lyrics = fs.readFileSync(lyricsPath, 'utf-8').trim();
    const spotifyData = JSON.parse(fs.readFileSync(spotifyPath, 'utf-8'));
    const geniusData = JSON.parse(fs.readFileSync(geniusPath, 'utf-8'));
    
    const title = spotifyData.name;
    const artist = spotifyData.artists[0].name;
    
    // Create the song and game
    game = await prisma.game.create({
      data: {
        date: rickrollDate,
        song: {
          create: {
            spotifyId: spotifyData.id,
            lyrics,
            maskedLyrics: createMaskedLyricsService().create(title, artist, lyrics) as unknown as Prisma.InputJsonValue,
            spotifyData,
            geniusData: geniusData.response.hits[0].result,
          }
        }
      },
      include: { song: true }
    });
  }
  return game;
};

export const GET = async (request: NextRequest, context: { params: Promise<{ date: string }> }) => {
  const prisma = new PrismaClient();
  try {
    const { params } = context;
    const { date } = await params;

    // Special case: rickroll
    if (date === 'rickroll') {
      const game = await createRickrollGame(prisma);
      if (!game || !game.song) {
        await prisma.$disconnect();
        return NextResponse.json({ error: "Failed to create or find rickroll game or song" }, { status: 500 });
      }
      const userId = request.headers.get('x-user-id')!;
      const gameStateService = createGameStateService(prisma);
      const result = await gameStateService.getGameState('2099-12-31', userId);
      if (!result) {
        await prisma.$disconnect();
        return NextResponse.json({ error: "Failed to generate game state for rickroll" }, { status: 500 });
      }
      await prisma.$disconnect();
      return NextResponse.json(result);
    }

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
      const maskedLyrics = game.song.maskedLyrics as unknown as MaskedLyrics;
      const allTokens: Token[] = [
        ...(maskedLyrics.title || []),
        ...(maskedLyrics.artist || []),
        ...(maskedLyrics.lyrics || [])
      ];
      const maskedWords = Array.isArray(allTokens)
        ? allTokens.filter((t: Token) => t.isToGuess).map((t: Token) => t.value.toLowerCase())
        : [];
      const totalMaskedWords = maskedWords.length;

      // Group valid guesses by player
      const playerGuesses: Record<string, Set<string>> = {};
      for (const g of validGuesses) {
        if (!playerGuesses[g.playerId]) playerGuesses[g.playerId] = new Set();
        playerGuesses[g.playerId].add(g.word.toLowerCase());
      }

      // Find players who found all masked words
      const winners = Object.entries(playerGuesses).filter(([, words]: [string, Set<string>]) =>
        maskedWords.every(w => words.has(w))
      );

      // Calculate completion percentage for winners
      const winnerCompletions = winners.map(([, words]: [string, Set<string>]) =>
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
        difficultyScore,
        wins: winners.length
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