import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
const { ReadableStream } = require('stream/web');

// Polyfills for Next.js 15+ in Node/Jest environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.ReadableStream = ReadableStream;

// ============================================================
// Env variables
// ============================================================
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'development_secret_for_tests_only';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
process.env.GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY ?? 'development_key_for_tests';

// ============================================================
// Потискане на очаквани console.error съобщения
// ============================================================
const originalError = console.error;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const message = args[0]?.toString() ?? '';
    const expectedErrors = [
      'Error reading users file:',
      'Warning: ReactDOM.render',
      'Warning: An update to',
      'ENOENT: no such file or directory'
    ];
    const isExpected = expectedErrors.some(e => message.includes(e));
    if (!isExpected) {
      originalError(...args);
    }
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});


// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Robust Global Mocks for Request/Response/Headers
class MockHeaders {
  private data = new Map<string, string>();
  constructor(init?: any) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([k, v]) => this.data.set(k.toLowerCase(), v));
      } else {
        Object.entries(init).forEach(([k, v]) => this.data.set(k.toLowerCase(), v as string));
      }
    }
  }
  get(name: string) { return this.data.get(name.toLowerCase()) || null; }
  set(name: string, value: string) { this.data.set(name.toLowerCase(), value); }
  forEach(cb: any) { this.data.forEach((v, k) => cb(v, k)); }
  has(name: string) { return this.data.has(name.toLowerCase()); }
}

class MockRequest {
  public headers: MockHeaders;
  constructor(public url: string, public init?: any) {
    this.headers = new MockHeaders(init?.headers);
  }
  async json() { 
    if (typeof this.init?.body === 'string') return JSON.parse(this.init.body);
    return this.init?.body || {}; 
  }
  get method() { return this.init?.method || 'GET'; }
}

class MockResponse {
  public status: number;
  public headers: MockHeaders;
  public ok: boolean;

  constructor(public body?: any, init?: any) {
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new MockHeaders(init?.headers);
  }

  async json() {
    if (typeof this.body === 'string') return JSON.parse(this.body);
    return this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  static json(data: any, init?: any) {
    return new MockResponse(data, {
      ...init,
      headers: { ...init?.headers, 'content-type': 'application/json' }
    });
  }
}

if (!global.Request) global.Request = MockRequest as any;
if (!global.Response) global.Response = MockResponse as any;
if (!global.Headers) global.Headers = MockHeaders as any;

// Mock Google Generative AI for tests
jest.mock('@google/genai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'Mocked AI Response' }
      }),
      generateContentStream: jest.fn().mockResolvedValue({
        stream: (async function* () {
          yield { text: () => 'Chunk 1' };
          yield { text: () => 'Chunk 2' };
        })()
      })
    })
  }))
}));
