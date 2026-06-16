import { NextRequest } from 'next/server';

const DEFAULT_MINIMAX_BASE_URL = 'https://api.minimax.io';
const ALLOWED_MINIMAX_BASE_URLS = new Set([
  'https://api.minimax.io',
  'https://api.minimaxi.com',
]);

const DOWNLOAD_HOST_SUFFIXES = ['.minimax.io', '.minimaxi.com'];
const DOWNLOAD_HOSTS = new Set(['minimax.io', 'minimaxi.com']);

export const UPSTREAM_TIMEOUT_MS = 30_000;
export const STREAM_TIMEOUT_MS = 120_000;
export const DOWNLOAD_TIMEOUT_MS = 30_000;
export const MAX_UPSTREAM_TEXT_BYTES = 2 * 1024 * 1024;
export const MAX_UPSTREAM_ERROR_BYTES = 64 * 1024;
export const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

export function getMiniMaxBaseUrl(request: NextRequest): string {
  const value = request.headers.get('x-base-url')?.trim() || DEFAULT_MINIMAX_BASE_URL;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid x-base-url');
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error('Invalid x-base-url');
  }

  const origin = parsed.origin;
  if (!ALLOWED_MINIMAX_BASE_URLS.has(origin)) {
    throw new Error('Invalid x-base-url');
  }

  return origin;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, {
    ...init,
    signal: controller.signal,
  });
}

export async function readArrayBufferLimited(response: Response, maxBytes: number): Promise<ArrayBuffer> {
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error('Response too large');
  }

  if (!response.body) {
    return new ArrayBuffer(0);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error('Response too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output.buffer;
}

export async function readTextLimited(response: Response, maxBytes: number = MAX_UPSTREAM_TEXT_BYTES): Promise<string> {
  const buffer = await readArrayBufferLimited(response, maxBytes);
  return new TextDecoder().decode(buffer);
}

export async function readJsonLimited<T = unknown>(
  response: Response,
  maxBytes: number = MAX_UPSTREAM_TEXT_BYTES
): Promise<T> {
  return JSON.parse(await readTextLimited(response, maxBytes)) as T;
}

export function parseTrustedDownloadUrl(value: unknown): URL | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowed =
    DOWNLOAD_HOSTS.has(hostname) ||
    DOWNLOAD_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));

  return allowed ? parsed : null;
}
