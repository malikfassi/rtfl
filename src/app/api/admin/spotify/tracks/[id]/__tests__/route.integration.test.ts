import { NextRequest } from 'next/server';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TEST_CASES } from '@/app/api/lib/test/fixtures/core/test_cases';

import { GET } from '../route';

const validSongCase = TEST_CASES.SONGS.VALID;
const spotifyTrack = validSongCase.spotify.getTrack();

describe('GET /api/admin/spotify/tracks/[id] Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  it('returns track when found', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${validSongCase.id}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: validSongCase.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    // The track data comes directly from the Spotify API, so we should match it exactly
    expect(data).toEqual(spotifyTrack);
  });

  it('returns 404 when track does not exist', async () => {
    // Use a valid format ID that doesn't exist
    const validFormatButNonexistentId = '1'.repeat(22);
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${validFormatButNonexistentId}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: validFormatButNonexistentId }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe('Track not found');
  });

  it('returns 400 for invalid track ID format', async () => {
    const invalidId = 'invalid-id';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${invalidId}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: invalidId }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid Spotify track ID format');
  });

  it('returns 400 for malformed track ID', async () => {
    // Use an ID that's too long
    const malformedId = '1234567890abcdef1234567890abcdef';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${malformedId}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: malformedId }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Invalid Spotify track ID format');
  });
}); 