import { NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/auth/email-otp';
import { getSessionUser } from '@/lib/auth/session-user';
import { setUserPassword } from '@/lib/auth/users';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { code?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { code?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (user.passwordHash) {
    const otp = verifyEmailOtp(user.email, code);
    if (!otp.ok) {
      return NextResponse.json({ ok: false, error: otp.error === 'invalid' ? 'invalid_code' : otp.error }, { status: 400 });
    }
  }

  const updated = await setUserPassword(user.id, password);
  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, hasPassword: true });
}
