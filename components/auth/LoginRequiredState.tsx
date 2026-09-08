'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LoginRequiredState({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  next?: string;
}) {
  const pathname = usePathname();
  const href = `/signin?next=${encodeURIComponent(next || pathname || '/')}`;

  return (
    <div className="flex min-h-[48vh] flex-col items-center justify-center px-6 text-center">
      <h3 className="text-2xl font-semibold tracking-tight text-[rgb(var(--foreground))]">
        {title}
      </h3>
      <p className="mt-3 max-w-md text-sm text-[rgb(var(--muted-foreground))]">
        {description}
      </p>
      <Link href={href} className="btn-primary mt-8 px-8">
        登录并继续
      </Link>
    </div>
  );
}
