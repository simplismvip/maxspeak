import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readJsonLimited,
  readTextLimited,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/server/security';
import { miniMaxAuth } from '@/lib/server/minimax-auth';

/**
 * POST /api/upload
 * Upload audio file for voice cloning
 */
export async function POST(request: NextRequest) {
  try {
    const auth = miniMaxAuth(request);
    if (!auth.ok) return auth.response;
    const { apiKey, baseUrl } = auth;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const purpose = (formData.get('purpose') as string) || 'voice_clone';

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload mp3, m4a, or wav files.' },
        { status: 400 }
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 20MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Create new FormData for the MiniMax request
    const minimaxForm = new FormData();
    minimaxForm.append('file', file);
    minimaxForm.append('purpose', purpose);

    const response = await fetchWithTimeout(`${baseUrl}/v1/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: minimaxForm,
    }, UPSTREAM_TIMEOUT_MS);

    if (!response.ok) {
      const err = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      return NextResponse.json({ error: `Upload error ${response.status}: ${err}` }, { status: response.status });
    }

    const data: any = await readJsonLimited(response);

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'File upload failed' },
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
      { error: error instanceof Error ? error.message : 'Upload error' },
      { status: 500 }
    );
  }
}
