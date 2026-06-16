import { NextRequest, NextResponse } from 'next/server';
import {
  DOWNLOAD_TIMEOUT_MS,
  fetchWithTimeout,
  isAbortError,
  MAX_DOWNLOAD_BYTES,
  MAX_UPSTREAM_ERROR_BYTES,
  parseTrustedDownloadUrl,
  readArrayBufferLimited,
  readTextLimited,
} from '@/lib/server/security';

/**
 * POST /api/tts/download
 * Proxy audio download from MiniMax CDN to avoid:
 *  - CORS blocking (browser fetch to cross-origin CDN)
 *  - MEDIA_ERR_SRC_NOT_SUPPORTED (CDN rejecting localhost requests)
 *
 * The server fetches the CDN URL and streams the audio bytes back
 * with proper Content-Type so the browser can create a blob URL.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    const { url } = await request.json();

    const downloadUrl = parseTrustedDownloadUrl(url);
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Trusted MiniMax HTTPS URL is required' }, { status: 400 });
    }

    console.log('[download-proxy] Fetching:', downloadUrl.toString().slice(0, 120));

    const response = await fetchWithTimeout(downloadUrl, {
      headers: {
        'Accept': 'audio/mpeg,audio/wav,audio/flac,audio/*,*/*',
      },
      // The CDN may reject requests without a plausible User-Agent
      // (Next.js server default User-Agent may not be blocked)
    }, DOWNLOAD_TIMEOUT_MS);

    if (!response.ok) {
      console.error('[download-proxy] CDN returned', response.status, response.statusText);
      return NextResponse.json(
        { error: `CDN returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    // If the CDN returned HTML (error page) instead of audio,
    // the content-type will be text/html — detect and reject
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const text = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      console.error('[download-proxy] CDN returned non-audio:', contentType, text);
      return NextResponse.json(
        { error: `CDN returned ${contentType} instead of audio` },
        { status: 502 }
      );
    }

    const buffer = await readArrayBufferLimited(response, MAX_DOWNLOAD_BYTES);

    console.log(`[download-proxy] OK - ${buffer.byteLength} bytes, type=${contentType}`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[download-proxy] Error:', error);
    if (isAbortError(error)) {
      return NextResponse.json({ error: 'Download timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message === 'Response too large') {
      return NextResponse.json({ error: 'Download response too large' }, { status: 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download error' },
      { status: 500 }
    );
  }
}
