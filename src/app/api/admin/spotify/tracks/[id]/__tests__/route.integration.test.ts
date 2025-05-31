import { NextRequest } from 'next/server';

import { 
  cleanupIntegrationTest,
  setupIntegrationTest, 
} from '@/app/api/lib/test';
import { TRACK_KEYS } from '@/app/api/lib/test/constants';
import { fixtures } from '@/app/api/lib/test/fixtures';
import { integration_validator } from '@/app/api/lib/test/validators';
import { ErrorCode } from '@/app/api/lib/errors/codes';
import { ErrorMessage } from '@/app/api/lib/errors/messages';

import { GET } from '../route';

const validTrackKey = TRACK_KEYS.PARTY_IN_THE_USA;
const validTrack = fixtures.spotify.tracks[validTrackKey];
const validTrackId = validTrack.id;

function getErrorMessage(msg: string | ((...args: any[]) => string), ...args: any[]): string {
  return typeof msg === 'function' ? msg(...args) : msg;
}

describe('GET /api/admin/spotify/tracks/[id] Integration', () => {
  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await cleanupIntegrationTest();
  });

  it('returns track when found', async () => {
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${validTrackId}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: validTrackId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    integration_validator.spotify_client.track(data, validTrackKey);
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
    expect(data.error).toBe(ErrorCode.TrackNotFound);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.TrackNotFound]));
  });

  it('returns 400 for invalid track ID format', async () => {
    const invalidId = 'invalid-id';
    const request = new NextRequest(
      new URL(`http://localhost:3000/api/admin/spotify/tracks/${invalidId}`)
    );

    const response = await GET(request, { params: Promise.resolve({ id: invalidId }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
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
    expect(data.error).toBe(ErrorCode.ValidationError);
    expect(data.message).toBe(getErrorMessage(ErrorMessage[ErrorCode.ValidationError]));
  });
}); 