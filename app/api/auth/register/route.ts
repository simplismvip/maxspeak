import { NextResponse } from 'next/server';
import { normalizeEmail, verifyEmailOtp } from '@/lib/auth/email-otp';
import { createUserWithPassword, findUserByEmail } from '@/lib/auth/users';

export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown; name?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown; name?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const name = typeof body.name === 'string' ? body.name : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });

  const otp = verifyEmailOtp(email, code);
  if (!otp.ok) {
    return NextResponse.json({ ok: false, error: otp.error }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ ok: false, error: 'email_taken' }, { status: 409 });
  }

  const created = await createUserWithPassword({ email, name, password });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
