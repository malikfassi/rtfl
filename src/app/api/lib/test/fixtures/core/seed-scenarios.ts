import { PrismaClient, Prisma } from '@prisma/client';
import { seedHelpers } from './seed-helpers';

// Define test scenarios
export const TEST_SCENARIOS = {
  BASIC: {
    songs: ['PARTY_IN_THE_USA', 'BILLIE_JEAN', 'LIKE_A_PRAYER'] as const,
    dates: ['2025-01-25', '2025-01-26', '2025-01-27']
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

  // Create games for the scenario dates
  for (let i = 0; i < scenario.dates.length; i++) {
    const date = scenario.dates[i];
    const songKey = scenario.songs[i % scenario.songs.length];
    const id = seedHelpers.SONG_IDS[songKey];
    
    // Get the created song
    const song = await prisma.song.findFirst({
      where: { spotifyId: id }
    });

    if (!song) {
      console.error(`Song not found for key ${songKey}`);
      continue;
    }
    
    console.log(`Creating game for date: ${date} with song: ${songKey}`);
    
    // Use the helper to create game data
    const gameInput = seedHelpers.createGameData(date, song.id);
    const game = await prisma.game.upsert(gameInput);

    // Create some example guesses using the helper
    const songInput = seedHelpers.createSongData(id);
    const guesses = seedHelpers.createGuesses(songInput.lyrics, game.id);

    console.log(`Adding ${guesses.length} guesses for game on ${date}`);

    // Create guesses with upsert to handle duplicates
    for (const guess of guesses) {
      await prisma.guess.upsert({
        where: {
          gameId_playerId_word: {
            gameId: guess.gameId,
            playerId: guess.playerId,
            word: guess.word
          }
        },
        create: guess,
        update: {} // No update needed if it exists
      });
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
