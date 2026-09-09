import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { ensureUserFromIdentity, type UserRecord } from '@/lib/auth/users';

export async function getSessionUser(): Promise<UserRecord | null> {
  const session = await getServerSession(authOptions);
  const fromSession = userFromSession(session);
  if (fromSession) return fromSession;

  const token = await getToken({
    req: { headers: { cookie: cookies().toString() } } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (typeof token?.email !== 'string') return null;
  return ensureUserFromIdentity({
    email: token.email,
    name: typeof token.name === 'string' ? token.name : undefined,
    image: typeof token.picture === 'string' ? token.picture : undefined,
  });
}

export function userFromSession(session: Session | null): UserRecord | null {
  const email = session?.user?.email;
  if (!email) return null;
  return ensureUserFromIdentity({
    email,
    name: session.user?.name,
    image: session.user?.image,
  });
}
