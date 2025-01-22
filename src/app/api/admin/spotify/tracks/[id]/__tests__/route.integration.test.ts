import { GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  setupIntegrationTest, 
  cleanupIntegrationTest, 
  spotifyData 
} from '@/lib/test';

describe('GET /api/admin/spotify/tracks/[id] Integration', () => {
  const [trackId] = Object.entries(spotifyData.tracks)[0];

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  test('returns track when found', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${trackId}`)
    );

    const response = await GET(request, { params: { id: trackId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(trackId);
    expect(data.name).toBeDefined();
    expect(data.artists).toBeDefined();
    expect(Array.isArray(data.artists)).toBe(true);
  });

  test('returns 404 when track does not exist', async () => {
    const nonexistentId = '1234567890abcdef1234567890abcdef';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${nonexistentId}`)
    );

    const response = await GET(request, { params: { id: nonexistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe('Track not found');
  });

  test('returns 400 for invalid track ID format', async () => {
    const invalidId = 'invalid-id';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${invalidId}`)
    );

    const response = await GET(request, { params: { id: invalidId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  test('returns 500 when Spotify API fails unexpectedly', async () => {
    // Force an API error by using a valid format ID that doesn't exist
    const validFormatButNonexistentId = '1'.repeat(22);
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${validFormatButNonexistentId}`)
    );

    const response = await GET(request, { params: { id: validFormatButNonexistentId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('SPOTIFY_ERROR');
  });
}); 