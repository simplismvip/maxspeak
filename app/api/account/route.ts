import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { updateUserName } from '@/lib/auth/users';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    email: user.email,
    name: user.name,
    hasPassword: Boolean(user.passwordHash),
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const updated = updateUserName(user.id, typeof body.name === 'string' ? body.name : '');
  if (!updated.ok) {
    return NextResponse.json({ ok: false, error: updated.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, name: updated.name, email: user.email });
}
