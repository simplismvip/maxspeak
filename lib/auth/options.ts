import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { normalizeEmail, verifyEmailOtp } from '@/lib/auth/email-otp';
import { safeInternalPath } from '@/lib/auth/next-path';
import { authenticateWithPassword, findUserByEmail, toAuthUser, upsertGoogleUser } from '@/lib/auth/users';

type AuthProvider = NextAuthOptions['providers'][number];

/** Register additional OAuth providers here (GitHub, Apple, etc.). */
export function authProviders(): AuthProvider[] {
  const providers: AuthProvider[] = [
    CredentialsProvider({
      id: 'password',
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || '');
        const password = credentials?.password || '';
        if (!email || !password) return null;
        const user = await authenticateWithPassword(email, password);
        return user ? toAuthUser(user) : null;
      },
    }),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || '');
        const code = credentials?.code?.trim() || '';
        if (!email) return null;
        const otp = verifyEmailOtp(email, code);
        if (!otp.ok) return null;
        const user = findUserByEmail(email);
        return user ? toAuthUser(user) : null;
      },
    }),
  ];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
}

export function oauthProviders(): AuthProvider[] {
  return authProviders().filter((provider) => provider.type === 'oauth');
}

export const authOptions: NextAuthOptions = {
  providers: authProviders(),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === 'google' && user?.email) {
        const row = upsertGoogleUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });
        if (row) {
          token.userId = row.id;
          token.email = row.email;
          token.name = row.name;
          token.picture = row.image || user.image;
        }
        token.provider = 'google';
        return token;
      }

      if (account?.provider) {
        token.provider = account.provider;
      }
      if (user?.id) token.userId = user.id;
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;

      if (trigger === 'update' && session && typeof session === 'object' && 'name' in session) {
        const name = typeof session.name === 'string' ? session.name : '';
        if (name) token.name = name;
      }

      if (!token.userId && typeof token.email === 'string') {
        const existing = findUserByEmail(token.email);
        if (existing) {
          token.userId = existing.id;
          token.name = existing.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === 'string' ? token.userId : undefined;
        session.user.provider = typeof token.provider === 'string' ? token.provider : undefined;
        if (typeof token.name === 'string') session.user.name = token.name;
        if (typeof token.email === 'string') session.user.email = token.email;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${safeInternalPath(url)}`;
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return `${baseUrl}${safeInternalPath(`${parsed.pathname}${parsed.search}`)}`;
        }
      } catch {
        /* ignore malformed callback URLs */
      }
      return `${baseUrl}/text-to-speech`;
    },
  },
};
