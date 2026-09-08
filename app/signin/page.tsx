'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function SignInPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = email.trim();
    if (!next.includes('@')) {
      setError('请输入有效邮箱');
      return;
    }
    signIn(next);
    router.replace('/text-to-speech');
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-semibold">登录 Voxify</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          当前是本地预览登录，用于打通工作区入口。正式账号体系（邮箱验证、OAuth、会话）会接到你指定的服务后再替换。
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full">进入工作区</button>
        </form>
        <p className="mt-6 text-center text-sm text-[rgb(var(--muted-foreground))]">
          先不想登录？<Link href="/text-to-speech" className="text-brand hover:underline">直接试用 Studio</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
