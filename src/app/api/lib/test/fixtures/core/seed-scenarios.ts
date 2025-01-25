import { PrismaClient, Prisma } from '@prisma/client';
import { seedHelpers } from './seed-helpers';

// Define test scenarios
export const TEST_SCENARIOS = {
  BASIC: {
    songs: ['PARTY_IN_THE_USA', 'BILLIE_JEAN', 'LIKE_A_PRAYER'] as const,
    dates: ['2025-01-25', '2025-01-26', '2025-01-27']
  },
  BASIC_NO_GUESSES: {
    songs: ['PARTY_IN_THE_USA', 'BILLIE_JEAN', 'LIKE_A_PRAYER'] as const,
    dates: ['2025-01-25', '2025-01-26', '2025-01-27'],
    skipGuesses: true
  },
  MIXED_LANGUAGES: {
    songs: ['LA_VIE_EN_ROSE', 'SWEET_CHILD_O_MINE'] as const,
    dates: ['2025-01-28', '2025-01-29']
  },
  // Add more test scenarios as needed
} as const;

export type TestScenario = keyof typeof TEST_SCENARIOS;

async function seedTestScenario(prisma: PrismaClient, scenarioKey: TestScenario) {
  const scenario = TEST_SCENARIOS[scenarioKey];
  console.log(`\nSeeding test scenario: ${scenarioKey}`);

  // Create songs for this scenario
  for (const songKey of scenario.songs) {
    const id = seedHelpers.SONG_IDS[songKey];
    
    // Check if song already exists
    const existingSong = await prisma.song.findFirst({
      where: { spotifyId: id }
    });

    if (existingSong) {
      console.log(`Song already exists: ${id} (${songKey})`);
      continue;
    }

    const songInput = seedHelpers.createSongData(id);
    
    // Convert JSON data to Prisma InputJsonValue
    const songData: Prisma.SongCreateInput = {
      spotifyId: songInput.spotifyId,
      spotifyData: songInput.spotifyData as Prisma.InputJsonValue,
      geniusData: songInput.geniusData as Prisma.InputJsonValue,
      lyrics: songInput.lyrics,
      maskedLyrics: songInput.maskedLyrics as Prisma.InputJsonValue,
    };
    
    console.log(`Creating song: ${songData.spotifyId} (${songKey})`);
    
    const song = await prisma.song.create({
      data: songData
    });
    
    console.log(`Created song with ID: ${song.id}`);
  }

  // Create games for this scenario
  for (let i = 0; i < scenario.songs.length; i++) {
    const date = scenario.dates[i];
    const songKey = scenario.songs[i];
    const songId = seedHelpers.SONG_IDS[songKey];
    
    // Get song ID from database
    const song = await prisma.song.findFirst({
      where: { spotifyId: songId }
    });

    if (!song) {
      throw new Error(`Failed to find song: ${songId}`);
    }

    console.log(`Creating game for date: ${date} with song: ${songKey}`);

    const game = await prisma.game.upsert({
      where: { date },
      create: {
        date,
        songId: song.id
      },
      update: {
        songId: song.id
      }
    });

    // Add guesses unless explicitly skipped
    if (!('skipGuesses' in scenario && scenario.skipGuesses)) {
      console.log(`Adding 5 guesses for game on ${date}`);
      const guesses = seedHelpers.createGuesses(song.lyrics, game.id);
      for (const guess of guesses) {
        await prisma.guess.create({ data: guess });
      }
    }
  }
}

export async function seedDatabase(prisma: PrismaClient, scenarios: TestScenario[] = ['BASIC']) {
  console.log('Starting database seed...');

  for (const scenario of scenarios) {
    await seedTestScenario(prisma, scenario);
  }

  console.log('\nSeed completed successfully');
} 
