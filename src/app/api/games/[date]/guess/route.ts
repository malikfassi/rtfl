import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getGameByDate } from '@/lib/db';
import { getSpotifyApi } from '@/lib/spotify/auth';
import { CacheService } from '@/lib/cache';
import { createMaskedText, updateMasking } from '@/lib/game/masking';
import type { Track } from '@spotify/web-api-ts-sdk';
import type { GuessResult } from '@/types/api';
import type { Prisma } from '@prisma/client';

const GuessSchema = z.object({
  userId: z.string(),
  word: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } },
): Promise<NextResponse<GuessResult | { error: string }>> {
  try {
    const body = await request.json();
    const { userId, word } = GuessSchema.parse(body);
    const { date } = params;

    // Get game and validate it exists
    const game = await getGameByDate(new Date(date));
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get playlist and validate track exists
    const spotifyApi = await getSpotifyApi();
    const playlist = await spotifyApi.playlists.getPlaylist(game.playlistId);
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const selectedTrack = playlist.tracks.items[game.selectedTrackIndex]?.track as
      | Track
      | undefined;
    if (!selectedTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Get lyrics
    const cache = new CacheService();
    const lyrics = await cache.getLyricsBySpotifyId(selectedTrack.id);
    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    // Get previous correct guesses
    const previousGuesses = await prisma.guess.findMany({
      where: {
        gameId: game.id,
        userId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    const correctGuesses = previousGuesses.map((g) => g.word.toLowerCase().trim());

    // Create initial masked content
    const maskedLyrics = lyrics ? createMaskedText(lyrics, correctGuesses) : null;
    const maskedTitle = createMaskedText(selectedTrack.name, correctGuesses);
    const maskedArtist = createMaskedText(selectedTrack.artists[0].name, correctGuesses);

    // Check if word matches any part of the song and update masking
    const normalizedWord = word.toLowerCase().trim();
    const isCorrect =
      maskedTitle.words.some((w) => w.word === normalizedWord) ||
      maskedArtist.words.some((w) => w.word === normalizedWord) ||
      (maskedLyrics?.words.some((w) => w.word === normalizedWord) ?? false);

    // Create guess
    const guessData: Prisma.GuessCreateInput = {
      userId,
      word,
      wasCorrect: isCorrect,
      game: {
        connect: {
          id: game.id,
        },
      },
    };

    const guess = await prisma.guess.create({
      data: guessData,
      include: {
        game: true,
      },
    });

    // Update masking if guess was correct
    const updatedLyrics =
      maskedLyrics && isCorrect ? updateMasking(maskedLyrics, normalizedWord) : maskedLyrics;
    const updatedTitle = isCorrect ? updateMasking(maskedTitle, normalizedWord) : maskedTitle;
    const updatedArtist = isCorrect ? updateMasking(maskedArtist, normalizedWord) : maskedArtist;

    // Calculate progress
    const totalWords =
      (updatedLyrics?.words.length ?? 0) + updatedTitle.words.length + updatedArtist.words.length;
    const revealedWords =
      (updatedLyrics?.revealedCount ?? 0) +
      updatedTitle.revealedCount +
      updatedArtist.revealedCount;
    const progress = totalWords > 0 ? revealedWords / totalWords : 0;

    // Determine what additional content to reveal
    const shouldRevealSpotify = progress >= 0.5; // Reveal Spotify data at 50% progress
    const shouldRevealGenius = progress >= 0.75; // Reveal Genius data at 75% progress

    return NextResponse.json({
      guess: {
        id: guess.id,
        userId: guess.userId,
        gameId: guess.gameId,
        word: guess.word,
        timestamp: guess.timestamp.toISOString(),
        isCorrect,
        game: {
          id: game.id,
          date: game.date.toISOString(),
          playlistId: game.playlistId,
          overrideSongId: game.overrideSongId,
          selectedTrackIndex: game.selectedTrackIndex,
          createdAt: game.createdAt.toISOString(),
          updatedAt: game.updatedAt.toISOString(),
          guesses: [],
        },
      },
      maskedContent: {
        lyrics: updatedLyrics,
        title: updatedTitle,
        artist: updatedArtist,
        progress,
        spotify: shouldRevealSpotify
          ? {
              artistName: selectedTrack.artists[0].name,
              songTitle: selectedTrack.name,
              albumCover: selectedTrack.album.images[0]?.url,
              previewUrl: selectedTrack.preview_url,
            }
          : null,
        genius: shouldRevealGenius
          ? {
              lyrics,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    console.error('Failed to submit guess:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
