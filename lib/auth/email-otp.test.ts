import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  OTP,
  clearEmailOtpStore,
  issueEmailOtp,
  normalizeEmail,
  verifyEmailOtp,
  discardEmailOtp,
} from '@/lib/auth/email-otp';

describe('normalizeEmail', () => {
  it('trims, lowercases, and rejects invalid addresses', () => {
    expect(normalizeEmail('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });
});

describe('email OTP', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    clearEmailOtpStore();
  });

  afterEach(() => {
    clearEmailOtpStore();
  });

  it('issues a 6-digit code and verifies it once', () => {
    const issued = issueEmailOtp('user@example.com', 1_000);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.code).toMatch(/^\d{6}$/);
    expect(verifyEmailOtp('user@example.com', issued.code, 1_000)).toEqual({ ok: true });
    expect(verifyEmailOtp('user@example.com', issued.code, 1_000)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('rejects a wrong code', () => {
    const issued = issueEmailOtp('user@example.com', 1_000);
    expect(issued.ok).toBe(true);
    expect(verifyEmailOtp('user@example.com', '000000', 1_000)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('expires after the ttl', () => {
    const issued = issueEmailOtp('user@example.com', 1_000);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(verifyEmailOtp('user@example.com', issued.code, 1_000 + OTP.ttlMs + 1)).toEqual({
      ok: false,
      error: 'expired',
    });
  });

  it('enforces send cooldown', () => {
    expect(issueEmailOtp('user@example.com', 1_000).ok).toBe(true);
    const again = issueEmailOtp('user@example.com', 1_000 + OTP.cooldownMs - 1);
    expect(again).toMatchObject({ ok: false, error: 'cooldown' });
    expect(issueEmailOtp('user@example.com', 1_000 + OTP.cooldownMs).ok).toBe(true);
  });

  it('allows a new issue after discard', () => {
    expect(issueEmailOtp('user@example.com', 1_000).ok).toBe(true);
    discardEmailOtp('user@example.com');
    expect(issueEmailOtp('user@example.com', 1_000).ok).toBe(true);
  });

  it('locks after too many attempts', () => {
    const issued = issueEmailOtp('user@example.com', 1_000);
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    for (let i = 0; i < OTP.maxAttempts - 1; i += 1) {
      expect(verifyEmailOtp('user@example.com', '000000', 1_000)).toEqual({
        ok: false,
        error: 'invalid',
      });
    }
    expect(verifyEmailOtp('user@example.com', '000000', 1_000)).toEqual({
      ok: false,
      error: 'too_many_attempts',
    });
    expect(verifyEmailOtp('user@example.com', issued.code, 1_000)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });
});
