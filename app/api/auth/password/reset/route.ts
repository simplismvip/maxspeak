import { NextResponse } from 'next/server';
import { normalizeEmail, verifyEmailOtp } from '@/lib/auth/email-otp';
import { findUserByEmail, setUserPassword } from '@/lib/auth/users';

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });

  const otp = verifyEmailOtp(email, code);
  if (!otp.ok) {
    return NextResponse.json({ ok: false, error: otp.error }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const updated = await setUserPassword(user.id, password);
  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
