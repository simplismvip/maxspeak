import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { listDesignedVoices } from '@/lib/billing/designed-voices';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const voices = listDesignedVoices(user.id).map((voice) => ({
    voiceId: voice.voiceId,
    prompt: voice.prompt,
    createdAt: voice.createdAt,
    unlocked: Boolean(voice.unlockedAt),
  }));
  return NextResponse.json({ voices });
}
