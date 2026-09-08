import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readTextLimited,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/server/security';
import { miniMaxAuth } from '@/lib/server/minimax-auth';

/**
 * POST /api/voices/list
 * Get voice list from MiniMax
 */
export async function POST(request: NextRequest) {
  try {
    const auth = miniMaxAuth(request);
    if (!auth.ok) return auth.response;
    const { apiKey, baseUrl } = auth;

    const body = await request.json();

    // MiniMax get_voice requires page_num
    const payload = {
      voice_type: body.voice_type || 'all',
      page_num: body.page_num ?? 1,
      page_size: body.page_size ?? 500,
    };

    console.log('[get_voice] Request:', JSON.stringify(payload));
    console.log('[get_voice] Base URL:', baseUrl);

    const response = await fetchWithTimeout(`${baseUrl}/v1/get_voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, UPSTREAM_TIMEOUT_MS);

    const rawText = await readTextLimited(
      response,
      response.ok ? undefined : MAX_UPSTREAM_ERROR_BYTES
    );

    if (!response.ok) {
      console.error('[get_voice] Error:', response.status, rawText.slice(0, 500));
      return NextResponse.json(
        { error: `Error ${response.status}: ${rawText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[get_voice] Non-JSON:', rawText.slice(0, 300));
      return NextResponse.json({ error: 'Non-JSON response' }, { status: 502 });
    }

    // Log response structure to debug
    const keys = Object.keys(data);
    console.log('[get_voice] Response keys:', keys);

    // MiniMax returns voices under top-level keys:
    // - system_voice (array or object keyed by language)
    // - voice_cloning (array)
    // - voice_generation (array)
    let voices: any[] = data.voice_list || data.voices || [];

    if (voices.length === 0 && data.data) {
      voices = data.data.voice_list || data.data.voices || [];
    }

    // Handle top-level grouped keys
    if (voices.length === 0) {
      for (const key of ['system_voice', 'system_voices', 'voice_cloning', 'voice_generation']) {
        const val = data[key] ?? data.data?.[key];
        if (val) {
          if (Array.isArray(val)) {
            voices.push(...val);
          } else if (typeof val === 'object') {
            // Grouped by language: e.g. { "Chinese": [...], "English": [...] }
            for (const v of Object.values(val)) {
              if (Array.isArray(v)) voices.push(...v);
            }
          }
          console.log(`[get_voice] From '${key}': added ${Array.isArray(val) ? val.length : Object.keys(val).length} groups, total=${voices.length}`);
        }
      }
    }

    console.log('[get_voice] Found', voices.length, 'voices');
    if (voices.length > 0) {
      console.log('[get_voice] Sample:', JSON.stringify(voices[0]).slice(0, 200));
    }

    return NextResponse.json({
      voice_list: voices,
      total_count: data.total_count || voices.length,
      base_resp: data.base_resp,
    });
  } catch (error) {
    console.error('[get_voice] Exception:', error);
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
