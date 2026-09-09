'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CollapsibleCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <span className="label mb-0 block">{title}</span>
          {hint ? (
            <p className="mt-0.5 text-[11px] text-[rgb(var(--muted-foreground))]">{hint}</p>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-[rgb(var(--muted-foreground))] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-[rgb(var(--border))] px-4 py-3">{children}</div>
      ) : null}
    </div>
  );
}
