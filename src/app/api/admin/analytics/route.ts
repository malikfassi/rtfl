import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const timeRangeSchema = z.enum(['day', 'week', 'month', 'all']).default('all');

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = timeRangeSchema.parse(searchParams.get('timeRange') ?? 'all');

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Default to epoch for 'all'
    
    if (timeRange === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeRange === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timeRange === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get games within time range
    const games = await prisma.game.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      include: {
        guesses: true,
      },
    });

    // Calculate game stats
    const totalGames = games.length;
    const completedGames = games.filter(game => {
      const uniqueUsers = new Set(game.guesses.map(g => g.userId));
      const correctGuesses = game.guesses.filter(g => g.wasCorrect).length;
      return correctGuesses > 0 && correctGuesses === uniqueUsers.size;
    }).length;

    const activeGames = games.filter(game => game.guesses.length > 0).length;
    
    // Calculate averages
    let totalGuessCount = 0;
    let totalCompletionTime = 0;
    let totalPlayers = new Set<string>();
    let activePlayers = new Set<string>();
    let playerStats: Record<string, { gamesCompleted: number; totalScore: number; totalTime: number }> = {};

    games.forEach(game => {
      const uniqueUsers = new Set(game.guesses.map(g => g.userId));
      totalGuessCount += game.guesses.length;
      
      uniqueUsers.forEach(userId => {
        totalPlayers.add(userId);
        const userGuesses = game.guesses.filter(g => g.userId === userId);
        if (userGuesses.length > 0) {
          activePlayers.add(userId);
          
          if (!playerStats[userId]) {
            playerStats[userId] = { gamesCompleted: 0, totalScore: 0, totalTime: 0 };
          }
          
          const firstGuess = userGuesses[0].timestamp;
          const lastGuess = userGuesses[userGuesses.length - 1].timestamp;
          const gameTime = (lastGuess.getTime() - firstGuess.getTime()) / 1000;
          
          if (userGuesses.some(g => g.wasCorrect)) {
            playerStats[userId].gamesCompleted++;
            playerStats[userId].totalScore += userGuesses.filter(g => g.wasCorrect).length;
            playerStats[userId].totalTime += gameTime;
          }
        }
      });
    });

    // Get top players
    const topPlayers = Object.entries(playerStats)
      .map(([userId, stats]) => ({
        username: userId, // TODO: Get actual username from auth system
        gamesCompleted: stats.gamesCompleted,
        averageScore: stats.totalScore / stats.gamesCompleted,
        averageTime: stats.totalTime / stats.gamesCompleted,
      }))
      .sort((a, b) => b.gamesCompleted - a.gamesCompleted)
      .slice(0, 10);

    return NextResponse.json({
      gameStats: {
        totalGames,
        activeGames,
        completedGames,
        averageCompletionRate: totalGames > 0 ? completedGames / totalGames : 0,
        averageGuessCount: activeGames > 0 ? totalGuessCount / activeGames : 0,
        averageCompletionTime: completedGames > 0 ? totalCompletionTime / completedGames : 0,
      },
      playerMetrics: {
        totalPlayers: totalPlayers.size,
        activePlayers: activePlayers.size,
        topPlayers,
      },
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
} 