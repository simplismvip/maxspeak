'use client';

import { Check, Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { voiceAvatarUrl } from '@/lib/voices/showcase';

interface LibraryVoiceCardProps {
  seed: string;
  name: string;
  description?: string;
  meta?: string;
  tags?: string[];
  selected?: boolean;
  canPreview?: boolean;
  previewLoading?: boolean;
  onPreview?: () => void;
  onUse: () => void;
}

export function LibraryVoiceCard({
  seed,
  name,
  description,
  meta,
  tags,
  selected,
  canPreview = true,
  previewLoading,
  onPreview,
  onUse,
}: LibraryVoiceCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-center rounded-xl border p-4 text-center transition',
        selected
          ? 'border-brand/50 bg-brand/[0.06]'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]/40 hover:border-brand/30 hover:bg-brand/[0.03]'
      )}
    >
      <button
        type="button"
        aria-label={`试听 ${name}`}
        disabled={!canPreview || !onPreview || previewLoading}
        onClick={onPreview}
        className="relative size-16 sm:size-20 disabled:cursor-default"
      >
        <div
          className={cn(
            'h-full w-full overflow-hidden rounded-full border-2 transition',
            selected ? 'border-brand/70' : 'border-[rgb(var(--border))] group-hover:border-brand/40'
          )}
        >
          <img
            src={voiceAvatarUrl(seed)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        {canPreview && onPreview ? (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-[rgb(var(--background))]/50 transition',
              previewLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {previewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            ) : (
              <Play className="h-6 w-6 fill-current" />
            )}
          </div>
        ) : null}
      </button>

      <div className="mt-3 w-full min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-2 line-clamp-1 text-[11px] text-[rgb(var(--muted-foreground))]">{meta}</p>
        ) : null}
        {tags && tags.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-[11px] text-[rgb(var(--muted-foreground))]">
            {tags.slice(0, 3).join(' · ')}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onUse}
        className={cn(
          'mt-3 text-xs font-medium transition',
          selected ? 'inline-flex items-center gap-1 text-brand' : 'text-brand hover:underline'
        )}
      >
        {selected ? (
          <>
            <Check size={12} />
            使用中
          </>
        ) : (
          '使用此音色 →'
        )}
      </button>
    </div>
  );
}
