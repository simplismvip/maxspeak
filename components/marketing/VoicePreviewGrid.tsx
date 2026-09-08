'use client';

import { Check, Loader2, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_WRAP } from '@/lib/site';
import { getShowcaseVoices, SHOWCASE_LANGUAGE_LABEL, voiceAvatarUrl } from '@/lib/voices/showcase';
import { useVoicePreview } from '@/lib/hooks/useVoicePreview';

export function VoicePreviewGrid() {
  const voices = getShowcaseVoices();
  const { preview, loadingId, playingId, error } = useVoicePreview();

  return (
    <section className={`${PAGE_WRAP} py-24`}>
      <div className="text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand">先听差别</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">先试听，再决定</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[rgb(var(--muted-foreground))]">
          点击任意音色即可试听，再挑选适合你内容的声音。
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-foreground))]">
          <Check size={14} className="text-brand" />
          只克隆你拥有授权的声音。
        </p>
      </div>

      {error && (
        <p className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          {error}
        </p>
      )}

      <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {voices.map((voice) => {
          const loading = loadingId === voice.id;
          const playing = playingId === voice.id;
          return (
            <button
              key={voice.id}
              type="button"
              aria-label={`试听 ${voice.name}`}
              onClick={() => void preview(voice)}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition',
                playing
                  ? 'border-brand/50 bg-brand/[0.06]'
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]/40 hover:border-brand/30 hover:bg-brand/[0.03]'
              )}
            >
              <div className="relative size-16 sm:size-20">
                <div
                  className={cn(
                    'h-full w-full overflow-hidden rounded-full border-2 transition',
                    playing ? 'border-brand/70' : 'border-[rgb(var(--border))] group-hover:border-brand/40'
                  )}
                >
                  <img
                    src={voiceAvatarUrl(voice.id)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center rounded-full bg-[rgb(var(--background))]/50 transition',
                    loading || playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                  ) : playing ? (
                    <Pause className="h-6 w-6 fill-current text-brand" />
                  ) : (
                    <Play className="h-6 w-6 fill-current" />
                  )}
                </div>
              </div>
              <div className="w-full min-w-0">
                <p className="truncate text-sm font-semibold">{voice.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                  {voice.description}
                </p>
                <p className="mt-2 line-clamp-1 text-[11px] text-[rgb(var(--muted-foreground))]">
                  {SHOWCASE_LANGUAGE_LABEL}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
