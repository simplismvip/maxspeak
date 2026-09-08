'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HelpTip({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full',
          'text-[rgb(var(--muted-foreground))] transition-colors hover:text-brand',
          open && 'text-brand',
        )}
      >
        <CircleHelp size={14} />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left text-xs font-normal normal-case tracking-normal text-[rgb(var(--foreground))] shadow-lg"
        >
          {title && <p className="mb-1.5 font-medium">{title}</p>}
          {children}
        </div>
      )}
    </span>
  );
}
