// Mock Request and Response globals for testing
global.Request = class Request {
  constructor(input, init) {
    this.input = input;
    this.init = init;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.init = init;
    this.headers = new Headers(init?.headers);
    this.status = init?.status || 200;
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'content-type': 'application/json',
      },
    });
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
};

// Mock Headers for testing
class Headers {
  constructor(init = {}) {
    this.headers = new Map(Object.entries(init));
  }

  get(key) {
    return this.headers.get(key) || null;
  }

  getSetCookie() {
    return [];
  }

  append(key, value) {
    this.headers.set(key, value);
  }
}

// Mock URL for testing
class URL {
  constructor(url) {
    this.url = url;
    const [pathname, search] = url.split('?');
    this.pathname = pathname;
    this.searchParams = new URLSearchParams(search || '');
  }
}

// Mock URLSearchParams for testing
class URLSearchParams {
  constructor(init = '') {
    this.params = new Map();
    if (typeof init === 'string') {
      init.split('&').forEach(pair => {
        if (!pair) return;
        const [key, value] = pair.split('=');
        if (key) this.params.set(key, decodeURIComponent(value || ''));
      });
    }
  }

  get(key) {
    return this.params.get(key) || null;
  }

  getAll(key) {
    return this.params.has(key) ? [this.params.get(key)] : [];
  }

  has(key) {
    return this.params.has(key);
  }
}

// Mock NextResponse
const NextResponse = {
  json(data, init) {
    const response = new Response(JSON.stringify(data), init);
    response.headers.append('x-nextjs-data', '1');
    return response;
  }
};

global.Headers = Headers;
global.URL = URL;
global.URLSearchParams = URLSearchParams;
global.Request = Request;
global.Response = Response;
jest.mock('next/server', () => ({
  NextResponse,
})); 
global.Response = Response; 