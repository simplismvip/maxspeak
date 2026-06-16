import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  getMiniMaxBaseUrl,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readJsonLimited,
  readTextLimited,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/server/security';

/**
 * POST /api/voices/clone
 * Create a voice clone from uploaded audio
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required.' }, { status: 401 });
    }

    let baseUrl: string;
    try {
      baseUrl = getMiniMaxBaseUrl(request);
    } catch {
      return NextResponse.json({ error: 'Invalid x-base-url' }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetchWithTimeout(`${baseUrl}/v1/voice_clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, UPSTREAM_TIMEOUT_MS);

    if (!response.ok) {
      const err = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      return NextResponse.json({ error: `Error ${response.status}: ${err}` }, { status: response.status });
    }

    const data: any = await readJsonLimited(response);

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'Voice clone failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: 'MiniMax API request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message === 'Response too large') {
      return NextResponse.json({ error: 'MiniMax response too large' }, { status: 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
