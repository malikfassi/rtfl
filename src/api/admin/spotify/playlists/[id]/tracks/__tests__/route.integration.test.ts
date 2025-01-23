import { GET } from '../route';
import { NextRequest } from 'next/server';
import { TEST_CASES } from '@/lib/test/fixtures/core/test_cases';
import { setupIntegrationTest, cleanupIntegrationTest } from '@/lib/test';

describe('GET /api/admin/spotify/playlists/[id]/tracks Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  it('returns tracks when playlist exists', async () => {
    const validPlaylistCase = TEST_CASES.PLAYLISTS.ALL_OUT_80S_90S;
    const spotifyTracks = validPlaylistCase.spotify.getTracks();
    const response = await GET(
      new NextRequest(new URL(`http://localhost:3000/api/admin/spotify/playlists/${validPlaylistCase.id}/tracks`)),
      { params: { id: validPlaylistCase.id } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toMatchObject({
      id: spotifyTracks[0].id,
      name: spotifyTracks[0].name,
      artists: spotifyTracks[0].artists
    });
  });

  it('returns 404 when playlist does not exist', async () => {
    const playlistId = '1'.repeat(22);
    const response = await GET(
      new NextRequest(new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)),
      { params: { id: playlistId } }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Playlist not found');
  });

  it('returns 400 for invalid playlist ID format', async () => {
    const playlistId = 'invalid-id';
    const response = await GET(
      new NextRequest(new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)),
      { params: { id: playlistId } }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid Spotify track ID format');
  });

  it('returns 400 for too long playlist ID', async () => {
    const playlistId = 'a'.repeat(300);
    const response = await GET(
      new NextRequest(new URL(`http://localhost:3000/api/admin/spotify/playlists/${playlistId}/tracks`)),
      { params: { id: playlistId } }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid Spotify track ID format');
  });
}); 