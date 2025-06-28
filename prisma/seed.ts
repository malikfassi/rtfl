import { PrismaClient } from '@prisma/client';
import { fixtures } from '../src/app/api/lib/test/fixtures';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a simple test song and game
  const testSong = await prisma.song.upsert({
    where: { id: 'test-song-id' },
    update: {},
    create: {
      id: 'test-song-id',
      spotifyId: 'test-song-id',
      lyrics: 'This is a test song\nWith some lyrics\nFor testing purposes',
      maskedLyrics: [
        { value: 'This', isToGuess: false },
        { value: 'is', isToGuess: false },
        { value: 'a', isToGuess: false },
        { value: 'test', isToGuess: true },
        { value: 'song', isToGuess: false },
        { value: 'With', isToGuess: false },
        { value: 'some', isToGuess: false },
        { value: 'lyrics', isToGuess: true },
        { value: 'For', isToGuess: false },
        { value: 'testing', isToGuess: true },
        { value: 'purposes', isToGuess: false }
      ],
      spotifyData: JSON.parse(JSON.stringify(fixtures.spotify.tracks.BABY_ONE_MORE_TIME || {})),
      geniusData: JSON.parse(JSON.stringify(fixtures.genius.search.BABY_ONE_MORE_TIME?.response?.hits?.[0]?.result || {}))
    }
  });

  // Create a test game for today
  const today = new Date().toISOString().split('T')[0];
  const testGame = await prisma.game.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      songId: testSong.id
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📅 Created game for ${today}`);
  console.log(`🎵 Created song: ${testSong.spotifyId}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 