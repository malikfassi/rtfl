import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Create sample game configs for the next 7 days
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    await prisma.gameConfig.create({
      data: {
        date,
        randomSeed: `seed-${i}`,
        playlistId: '37i9dQZF1DXcBWIGoYBM5M', // Top 50 Global
        guesses: {
          create: [
            {
              userId: 'test-user-1',
              word: 'love',
              timestamp: new Date(),
            },
            {
              userId: 'test-user-2',
              word: 'heart',
              timestamp: new Date(),
            },
          ],
        },
      },
    });
  }

  // Create sample cached data
  await prisma.cachedSpotifyTrack.create({
    data: {
      spotifyId: '11dFghVXANMlKmJXsNCbNl',
      data: JSON.stringify({
        name: 'Cut To The Feeling',
        artist: 'Carly Rae Jepsen',
      }),
    },
  });

  await prisma.cachedSpotifyPlaylist.create({
    data: {
      spotifyId: '37i9dQZF1DXcBWIGoYBM5M',
      data: JSON.stringify({
        name: 'Top 50 Global',
        tracks: ['track1', 'track2'],
      }),
    },
  });

  await prisma.cachedGeniusLyrics.create({
    data: {
      geniusId: 'genius-123',
      spotifyId: '11dFghVXANMlKmJXsNCbNl',
      lyrics: 'I wanna cut to the feeling...',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
