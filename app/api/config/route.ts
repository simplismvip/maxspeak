import { NextResponse } from 'next/server';
import { DEFAULT_MINIMAX_BASE_URL, hasServerMiniMaxKey } from '@/lib/server/security';

export async function GET() {
  const envBase = process.env.MINIMAX_BASE_URL?.trim();
  return NextResponse.json({
    hasServerKey: hasServerMiniMaxKey(),
    defaultBaseUrl: envBase || DEFAULT_MINIMAX_BASE_URL,
  });
}
