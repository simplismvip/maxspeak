import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  MAX_VOICE_DESIGN_BYTES,
  readJsonLimited,
  readTextLimited,
  VOICE_DESIGN_TIMEOUT_MS,
} from '@/lib/server/security';
import { miniMaxAuth } from '@/lib/server/minimax-auth';
import { getSessionUser } from '@/lib/auth/session-user';
import { saveDesignedVoice } from '@/lib/billing/designed-voices';

export const maxDuration = 180;

/**
 * POST /api/voice-design
 * Design a voice from text description
 */
export async function POST(request: NextRequest) {
  try {
    const auth = miniMaxAuth(request);
    if (!auth.ok) return auth.response;
    const { apiKey, baseUrl } = auth;

    const body = await request.json();

    if (!body.prompt || !body.preview_text) {
      return NextResponse.json(
        { error: 'Both prompt and preview_text are required.' },
        { status: 400 }
      );
    }

    if (body.prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt must be 500 characters or less.' },
        { status: 400 }
      );
    }

    const response = await fetchWithTimeout(`${baseUrl}/v1/voice_design`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, VOICE_DESIGN_TIMEOUT_MS);

    if (!response.ok) {
      const err = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      return NextResponse.json({ error: `Error ${response.status}: ${err}` }, { status: response.status });
    }

    const data: any = await readJsonLimited(response, MAX_VOICE_DESIGN_BYTES);

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'Voice design failed' },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const designedId = typeof data.voice_id === 'string' ? data.voice_id : '';
    if (user && designedId) {
      saveDesignedVoice({
        userId: user.id,
        voiceId: designedId,
        prompt: String(body.prompt || ''),
      });
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
