import { NextRequest, NextResponse } from 'next/server';
import { MiniMaxConfigError, resolveMiniMaxAuth } from '@/lib/server/security';

export function miniMaxAuth(request: NextRequest):
  | { ok: true; apiKey: string; baseUrl: string }
  | { ok: false; response: NextResponse } {
  try {
    const auth = resolveMiniMaxAuth(request);
    return { ok: true, ...auth };
  } catch (error) {
    if (error instanceof MiniMaxConfigError) {
      return {
        ok: false,
        response: NextResponse.json({ error: error.message }, { status: error.status }),
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid MiniMax configuration' }, { status: 400 }),
    };
  }
}
