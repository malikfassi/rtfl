'use client';

type MockRequestInit = {
  method?: string;
  body?: Record<string, unknown>;
};

// Simple mock for testing that provides just what we need
export class MockRequest {
  url: string;
  nextUrl: URL;
  private method: string;
  private bodyData?: Record<string, unknown>;

  constructor(url: string, init?: MockRequestInit) {
    this.url = url;
    const parsedUrl = new URL(url);
    // Create a proper URL object with searchParams
    this.nextUrl = parsedUrl;
    this.method = init?.method || 'GET';
    this.bodyData = init?.body;
  }

  json() {
    return Promise.resolve(this.bodyData || {});
  }
}

// Helper to create a mock request - typescript will infer the correct type
export function createMockRequest(url: string, init?: MockRequestInit) {
  return new MockRequest(url, init);
} 