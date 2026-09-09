'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { useAuthStore } from '@/lib/store/useAuthStore';

export function AccountPanel() {
  const { data, update, status } = useSession();
  const setFromSession = useAuthStore((s) => s.setFromSession);
  const signOutLocal = useAuthStore((s) => s.signOut);
  const [name, setName] = useState(data?.user?.name || '');
  const [hasPassword, setHasPassword] = useState(true);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (data?.user?.name) setName(data.user.name);
  }, [data?.user?.name]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void fetch('/api/account')
      .then((response) => response.json())
      .then((payload: { name?: string; hasPassword?: boolean }) => {
        if (payload.name) setName(payload.name);
        if (typeof payload.hasPassword === 'boolean') setHasPassword(payload.hasPassword);
      })
      .catch(() => undefined);
  }, [status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSaveName = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingName(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as { ok?: boolean; name?: string; error?: string };
      if (!response.ok) {
        if (payload.error === 'invalid_name') setError('请输入 1–32 个字符的昵称。');
        else if (payload.error === 'unauthorized') setError('登录已失效，请重新登录。');
        else setError('保存失败，请重试。');
        return;
      }
      if (payload.name) {
        setName(payload.name);
        await update({ name: payload.name });
        const email = data?.user?.email;
        if (email) {
          setFromSession({
            email,
            name: payload.name,
            image: data?.user?.image || undefined,
            provider: data?.user?.provider,
          });
        }
      }
      setMessage('昵称已更新。');
    } catch {
      setError('保存失败，请重试。');
    } finally {
      setSavingName(false);
    }
  };

  const sendCode = async () => {
    const email = data?.user?.email;
    if (!email) return;
    setError('');
    setSendingCode(true);
    try {
      const response = await fetch('/api/auth/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string; retryAfterSec?: number };
      if (!response.ok) {
        setError(payload.error === 'cooldown' ? `请 ${payload.retryAfterSec || 60} 秒后再发送。` : '验证码发送失败，请重试。');
        if (payload.retryAfterSec) setCooldown(payload.retryAfterSec);
        return;
      }
      setCodeSent(true);
      setCooldown(payload.retryAfterSec || 60);
      setMessage('验证码已发送到邮箱。');
    } catch {
      setError('验证码发送失败，请重试。');
    } finally {
      setSendingCode(false);
    }
  };

  const onSavePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (payload.error === 'invalid_password') setError('新密码至少 8 位。');
        else if (payload.error === 'invalid_code' || payload.error === 'expired' || payload.error === 'too_many_attempts') {
          setError('验证码不正确或已过期。');
        } else if (payload.error === 'unauthorized') setError('登录已失效，请重新登录。');
        else setError('修改失败，请重试。');
        return;
      }
      setCode('');
      setCodeSent(false);
      setPassword('');
      setConfirmPassword('');
      setHasPassword(true);
      setMessage(hasPassword ? '密码已更新。' : '密码已设置，之后可以用邮箱密码登录。');
    } catch {
      setError('修改失败，请重试。');
    } finally {
      setSavingPassword(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-sm text-[rgb(var(--muted-foreground))]">加载中...</main>
        <SiteFooter />
      </>
    );
  }

  if (!data?.user?.email) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">请先登录后再打开用户中心。</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">用户中心</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">管理昵称和密码。登录状态大约保持 30 天。</p>

        <section className="card mt-8 p-5">
          <h2 className="text-sm font-medium">账号</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">{data.user.email}</p>
        </section>

        <form className="card mt-4 space-y-3 p-5" onSubmit={onSaveName}>
          <h2 className="text-sm font-medium">昵称</h2>
          <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
          <button type="submit" disabled={savingName} className="btn-primary h-10">
            {savingName ? '保存中...' : '保存昵称'}
          </button>
        </form>

        <form className="card mt-4 space-y-3 p-5" onSubmit={onSavePassword}>
          <h2 className="text-sm font-medium">{hasPassword ? '修改密码' : '设置密码'}</h2>
          {hasPassword ? (
            <>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">为确认是你本人，请先验证邮箱，再设置新密码。</p>
              <button
                type="button"
                disabled={sendingCode || cooldown > 0}
                onClick={() => void sendCode()}
                className="btn-secondary h-10"
              >
                {sendingCode ? '发送中...' : cooldown > 0 ? `${cooldown} 秒后可重新发送` : codeSent ? '重新发送验证码' : '发送验证码'}
              </button>
              <label className="block">
                <span className="label">验证码</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field tracking-[0.3em]"
                />
              </label>
            </>
          ) : (
            <p className="text-xs text-[rgb(var(--muted-foreground))]">当前账号还没有密码，设置后即可用邮箱密码登录。</p>
          )}
          <label className="block">
            <span className="label">新密码</span>
            <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="input-field" autoComplete="new-password" />
          </label>
          <label className="block">
            <span className="label">确认新密码</span>
            <input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field" />
          </label>
          <button type="submit" disabled={savingPassword} className="btn-primary h-10">
            {savingPassword ? '保存中...' : hasPassword ? '更新密码' : '设置密码'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-brand">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          className="btn-secondary mt-8 h-10"
          onClick={() => {
            void signOut({ callbackUrl: '/' }).then(() => signOutLocal());
          }}
        >
          退出登录
        </button>
      </main>
      <SiteFooter />
    </>
  );
}
