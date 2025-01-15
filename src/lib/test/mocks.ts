'use client';

type MockRequestInit = {
  method?: string;
  body?: Record<string, unknown>;
};

// Simple mock for testing that provides just what we need
export class MockRequest {
  readonly url: string;
  readonly nextUrl: URL;
  readonly method: string;
  readonly bodyData: Record<string, unknown> | undefined;
  readonly headers = new Headers();
  readonly cache = 'default';
  readonly credentials = 'same-origin';
  readonly destination = '';
  readonly integrity = '';
  readonly keepalive = false;
  readonly mode = 'cors';
  readonly redirect = 'follow';
  readonly referrer = '';
  readonly referrerPolicy = '';
  readonly signal = new AbortController().signal;
  readonly body = null;
  readonly bodyUsed = false;

  constructor(url: string, init?: MockRequestInit) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.method = init?.method || 'GET';
    this.bodyData = init?.body;
  }

  async json() {
    return this.bodyData || {};
  }

  async text() {
    return '';
  }

  async blob() {
    return new Blob();
  }

  async arrayBuffer() {
    return new ArrayBuffer(0);
  }

  async formData() {
    return new FormData();
  }

  clone() {
    return new MockRequest(this.url, { method: this.method, body: this.bodyData });
  }
}

// Helper to create a mock request - typescript will infer the correct type
export function createMockRequest(url: string, init?: MockRequestInit) {
  return new MockRequest(url, init);
} 