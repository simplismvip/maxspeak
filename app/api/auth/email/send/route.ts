import { NextResponse } from 'next/server';
import { discardEmailOtp, issueEmailOtp } from '@/lib/auth/email-otp';
import { sendLoginCode } from '@/lib/auth/mailer';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email : '';
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const issued = issueEmailOtp(email);
  if (!issued.ok) {
    const status = issued.error === 'cooldown' ? 429 : 400;
    return NextResponse.json(
      { ok: false, error: issued.error, retryAfterSec: issued.retryAfterSec },
      { status }
    );
  }

  try {
    const { delivery } = await sendLoginCode(issued.email, issued.code);
    return NextResponse.json({ ok: true, delivery });
  } catch (error) {
    discardEmailOtp(issued.email);
    const message = error instanceof Error ? error.message : 'send_failed';
    console.error('[Voxify] Failed to send login code:', message);
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 });
  }
}
