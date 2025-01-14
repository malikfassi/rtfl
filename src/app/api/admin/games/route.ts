import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { CacheService } from '../../../../lib/cache';

export async function GET() {
  try {
    // Get all game configs with guesses
    const configs = await prisma.gameConfig.findMany({
      include: {
        guesses: true,
      },
    });

    // Initialize cache service
    const cache = new CacheService();

    // Enrich each config with cached data
    const enrichedConfigs = await Promise.all(
      configs.map(async (config) => {
        // Get cached playlist data
        const playlistData = await cache.getPlaylist(config.playlistId);
        if (!playlistData) {
          throw new Error(`Playlist ${config.playlistId} not found in cache`);
        }

        return {
          id: config.id,
          playlistId: config.playlistId,
          playlist: playlistData,
          guesses: config.guesses,
          createdAt: config.createdAt.toISOString(),
          updatedAt: config.updatedAt.toISOString(),
        };
      }),
    );

    return NextResponse.json(enrichedConfigs);
  } catch (error) {
    console.error('Failed to list game configs:', error);
    return NextResponse.json({ error: 'Failed to list game configs' }, { status: 500 });
  }
}
