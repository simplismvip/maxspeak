'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatDuration, downloadBlob } from '@/lib/utils';
import { hexAudioToBlob } from '@/lib/audio/utils';
import { cn } from '@/lib/utils';
import { PAGE_WRAP } from '@/lib/site';
import { Play, Pause, Download, Loader2, Volume2 } from 'lucide-react';

/**
 * AudioPlayer — native <audio> (not display:none) for reliable playback.
 * `fixed`: bottom bar on studio pages other than text-to-speech.
 * `inline`: in-page result area on the TTS panel.
 */
export function AudioPlayer({ variant = 'fixed' }: { variant?: 'fixed' | 'inline' }) {
  const pathname = usePathname();
  const player = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    const url = player.audioUrl;
    if (!audio || !url) return;
    if (urlRef.current === url) return;
    if (urlRef.current?.startsWith('blob:')) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setAudioError(null);

    audio.src = url;
    audio.load();
  }, [player.audioUrl]);

  const tryAutoPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || audio.src === window.location.href) return;

    audio.play()
      .then(() => player.setPlaying(true))
      .catch((err) => {
        console.warn('Auto-play deferred (click play button):', err.message);
      });
  }, [player]);

  useEffect(() => {
    if (variant === 'fixed' && pathname === '/text-to-speech') return;
    (window as any).__audioPlayerPlay = tryAutoPlay;
    return () => { delete (window as any).__audioPlayerPlay; };
  }, [tryAutoPlay, variant, pathname]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      player.setPlaying(false);
    } else {
      if (!audio.src || audio.src === window.location.href) {
        const storedUrl = urlRef.current || player.audioUrl;
        if (storedUrl) {
          audio.src = storedUrl;
          audio.load();
        } else {
          console.error('No audio URL to play');
          return;
        }
      }

      audio.play()
        .then(() => player.setPlaying(true))
        .catch((err) => {
          console.error('Play failed:', err);
          setAudioError('播放失败，请重试');
        });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) player.setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration)) {
      player.setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    player.setPlaying(false);
    player.setCurrentTime(0);
  };

  const handleAudioError = () => {
    const audio = audioRef.current;
    const code = audio?.error?.code;
    const msg = audio?.error?.message || 'unknown';
    console.error('Audio error:', code, msg, 'src:', audio?.src?.slice(0, 80));
    setAudioError(`音频加载失败 (${code || 'unknown'})`);
    player.setPlaying(false);
  };

  const handleDownload = async () => {
    const lastAudio = player.lastGeneratedAudio;
    if (!lastAudio) return;

    try {
      if (lastAudio.url) {
        try {
          const directRes = await fetch(lastAudio.url, { mode: 'cors' });
          if (directRes.ok) {
            const blob = await directRes.blob();
            downloadBlob(blob, lastAudio.fileName);
            return;
          }
        } catch {
          /* CORS blocked — fall through to proxy */
        }
      }

      if (lastAudio.url) {
        try {
          const res = await fetch('/api/tts/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: lastAudio.url }),
          });
          if (res.ok) {
            const blob = await res.blob();
            downloadBlob(blob, lastAudio.fileName);
            return;
          }
        } catch {
          /* Proxy failed — fall through */
        }
      }

      if (lastAudio.hex) {
        const blob = hexAudioToBlob(lastAudio.hex, lastAudio.format);
        downloadBlob(blob, lastAudio.fileName);
        return;
      }

      if (lastAudio.url) {
        window.open(lastAudio.url, '_blank');
      }
    } catch {
      if (lastAudio.url) window.open(lastAudio.url, '_blank');
    }
  };

  const hasContent =
    (player.audioUrl && player.audioUrl !== window.location.href) ||
    player.isStreaming ||
    player.isLoading;
  const isLoading = player.isLoading || player.isStreaming;
  const isActive = player.isPlaying && !player.isStreaming;

  const audioEl = (
    <audio
      id={variant === 'inline' ? 'inline-player-audio' : 'main-player-audio'}
      ref={audioRef}
      preload="auto"
      controls={false}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onPlay={() => player.setPlaying(true)}
      onPause={() => player.setPlaying(false)}
      onError={handleAudioError}
      style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
    />
  );

  const controls = (
    <div className="flex w-full items-center gap-3">
      <button
        onClick={handlePlayPause}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
          isLoading
            ? 'bg-brand/10 cursor-default'
            : 'bg-brand hover:brightness-110 text-brand-foreground active:scale-95'
        )}
      >
        {isLoading ? (
          <Loader2 size={20} className="animate-spin text-brand" />
        ) : isActive ? (
          <Pause size={18} />
        ) : (
          <Play size={18} className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {player.isStreaming ? (
          <div className="space-y-1">
            <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{ width: `${Math.max(player.streamingProgress, 2)}%` }}
              />
            </div>
            <p className="text-[10px] text-[rgb(var(--muted-foreground))]">
              流式接收中... {player.streamingReceivedChunks} chunks
            </p>
          </div>
        ) : audioError ? (
          <div className="space-y-1">
            <p className="text-xs text-red-500">{audioError}</p>
            <button
              onClick={() => {
                setAudioError(null);
                const audio = audioRef.current;
                if (audio && player.audioUrl) {
                  audio.src = player.audioUrl;
                  audio.load();
                }
              }}
              className="text-[10px] text-primary-600 hover:underline"
            >
              点击重试
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div
              className="relative h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden cursor-pointer group"
              title="点击跳转播放位置"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const audio = audioRef.current;
                if (audio && player.duration > 0) {
                  audio.currentTime = ratio * player.duration;
                }
              }}
            >
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{
                  width: `${player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[rgb(var(--muted-foreground))]">
              <span>{formatDuration(player.currentTime)}</span>
              <span>{player.isStreaming ? '...' : formatDuration(player.duration)}</span>
            </div>
          </div>
        )}
      </div>

      {player.lastGeneratedAudio && (
        <button
          onClick={handleDownload}
          className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors flex-shrink-0"
          title="下载音频"
        >
          <Download size={18} className="text-[rgb(var(--muted-foreground))]" />
        </button>
      )}
    </div>
  );

  if (variant === 'fixed' && pathname === '/text-to-speech') {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className="card p-3">
        {audioEl}
        {hasContent ? (
          <div className="flex min-h-[148px] items-center px-3 py-4">
            {controls}
          </div>
        ) : (
          <div className="flex min-h-[148px] flex-col items-center justify-center rounded-xl border border-dashed border-[rgb(var(--border))] px-6 py-10 text-center">
            <Volume2 size={22} className="mb-3 text-[rgb(var(--muted-foreground))]" />
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">
              生成的音频会显示在这里
            </p>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[rgb(var(--muted-foreground))]">
              输入文本并选择声音，生成后即可在这里试听最新结果。
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!hasContent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 backdrop-blur-sm flex-shrink-0 shadow-lg">
      {audioEl}
      <div className={cn(PAGE_WRAP, 'flex items-center gap-3 py-3.5')}>
        {controls}
      </div>
    </div>
  );
}
