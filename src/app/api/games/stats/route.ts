import { NextResponse } from 'next/server';
import { handleError } from '@/app/api/lib/utils/error-handler';
import { validateSchema, schemas } from '@/app/api/lib/validation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }
    
    const validatedDate = validateSchema(schemas.date, date);
    
    // Get game for the date
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
    
    if (!game) {
      return NextResponse.json({ error: 'No game found for this date' }, { status: 404 });
    }
    
    // Calculate stats
    const totalPlayers = new Set(game.guesses.map(g => g.playerId)).size;
    const validGuesses = game.guesses.filter(g => g.valid);
    const totalValidGuesses = validGuesses.length;
    const averageGuesses = totalPlayers > 0 ? Math.round(totalValidGuesses / totalPlayers) : 0;
    
    // --- New logic for average lyrics completion for winning players ---
    // Assume maskedLyrics is an array of tokens with isToGuess property
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
    // For each winner, compute their completion % (should be 100, but keep logic flexible)
    const winnerCompletions = winners.map(([_playerId, words]) =>
      totalMaskedWords > 0 ? Math.round((Array.from(words).filter(w => maskedWords.includes(w)).length / totalMaskedWords) * 100) : 0
    );
    const averageLyricsCompletionForWinners = winnerCompletions.length > 0
      ? Math.round(winnerCompletions.reduce((a, b) => a + b, 0) / winnerCompletions.length)
      : 0;

    // Calculate difficultyScore: higher average guesses per player = higher difficulty
    let difficultyScore = 5;
    if (totalMaskedWords > 0) {
      difficultyScore = Math.max(1, Math.min(10, Math.round((averageGuesses / totalMaskedWords) * 10)));
    }

    const stats = {
      date: validatedDate,
      totalPlayers,
      averageGuesses,
      totalValidGuesses,
      averageLyricsCompletionForWinners,
      difficultyScore
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    return handleError(error);
  }
} 