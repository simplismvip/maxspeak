'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { SITE, NAV_LINKS, PAGE_WRAP } from '@/lib/site';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))]/80 bg-[rgb(var(--background))]/90 backdrop-blur">
      <div className={`${PAGE_WRAP} flex h-14 items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png?v=3" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="flex items-center gap-1">
            <Link href="/text-to-speech" className="btn-secondary h-9 px-3 text-xs">
              <UserRound size={14} />
              {user.name}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="btn-ghost h-9 px-2 text-xs"
            >
              退出
            </button>
          </div>
        ) : (
          <Link href="/signin" className="btn-secondary h-9 px-3 text-xs">
            <UserRound size={14} />
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
