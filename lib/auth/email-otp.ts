import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const OTP = {
  ttlMs: 10 * 60 * 1000,
  cooldownMs: 60_000,
  maxAttempts: 5,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type OtpEntry = {
  hash: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

const globalForOtp = globalThis as typeof globalThis & {
  __voxifyEmailOtp?: Map<string, OtpEntry>;
};

const store = globalForOtp.__voxifyEmailOtp ?? new Map<string, OtpEntry>();
globalForOtp.__voxifyEmailOtp = store;

function otpSecret() {
  return process.env.NEXTAUTH_SECRET || 'dev-otp-secret';
}

function hashOtp(email: string, code: string) {
  return createHmac('sha256', otpSecret()).update(`${email}:${code}`).digest('hex');
}

function hashesMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizeEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!value || value.length > 254 || !EMAIL_RE.test(value)) return null;
  return value;
}

export function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export type IssueEmailOtpResult =
  | { ok: true; email: string; code: string }
  | { ok: false; error: 'invalid_email' | 'cooldown'; retryAfterSec?: number };

export function issueEmailOtp(emailRaw: string, now = Date.now()): IssueEmailOtpResult {
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false, error: 'invalid_email' };

  const existing = store.get(email);
  if (existing && now - existing.sentAt < OTP.cooldownMs) {
    return {
      ok: false,
      error: 'cooldown',
      retryAfterSec: Math.ceil((OTP.cooldownMs - (now - existing.sentAt)) / 1000),
    };
  }

  const code = generateOtpCode();
  store.set(email, {
    hash: hashOtp(email, code),
    expiresAt: now + OTP.ttlMs,
    sentAt: now,
    attempts: 0,
  });
  return { ok: true, email, code };
}

export type VerifyEmailOtpResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'expired' | 'too_many_attempts' };

export function verifyEmailOtp(emailRaw: string, code: string, now = Date.now()): VerifyEmailOtpResult {
  const email = normalizeEmail(emailRaw);
  if (!email || !/^\d{6}$/.test(code)) return { ok: false, error: 'invalid' };

  const entry = store.get(email);
  if (!entry) return { ok: false, error: 'invalid' };

  if (now > entry.expiresAt) {
    store.delete(email);
    return { ok: false, error: 'expired' };
  }

  if (entry.attempts >= OTP.maxAttempts) {
    store.delete(email);
    return { ok: false, error: 'too_many_attempts' };
  }

  if (!hashesMatch(entry.hash, hashOtp(email, code))) {
    entry.attempts += 1;
    if (entry.attempts >= OTP.maxAttempts) {
      store.delete(email);
      return { ok: false, error: 'too_many_attempts' };
    }
    return { ok: false, error: 'invalid' };
  }

  store.delete(email);
  return { ok: true };
}

export function discardEmailOtp(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  if (email) store.delete(email);
}

export function clearEmailOtpStore() {
  store.clear();
}
