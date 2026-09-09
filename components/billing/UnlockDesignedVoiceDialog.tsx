'use client';

import { useState } from 'react';
import { CircleDollarSign, X } from 'lucide-react';
import { useDesignedVoiceStore } from '@/lib/store/useDesignedVoiceStore';
import { useTTSStore } from '@/lib/store/useTTSStore';

export function UnlockDesignedVoiceDialog() {
  const pending = useDesignedVoiceStore((s) => s.pending);
  const closeUnlock = useDesignedVoiceStore((s) => s.closeUnlock);
  const markUnlocked = useDesignedVoiceStore((s) => s.markUnlocked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pending) return null;

  const onUnlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/voices/designed/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: pending.voiceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || '解锁失败');
      }
      markUnlocked(pending.voiceId);
      useTTSStore.getState().selectVoiceFromLibrary({
        voiceId: pending.voiceId,
        source: 'designed',
      });
      closeUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解锁失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <CircleDollarSign size={16} className="text-brand" />
              解锁设计音色
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              一次性付费后，这条音色可自由用于生成语音，付费标识会去掉。
            </p>
          </div>
          <button type="button" onClick={closeUnlock} className="rounded-lg p-1 hover:bg-[rgb(var(--muted))]">
            <X size={16} />
          </button>
        </div>
        <div className="rounded-xl bg-[rgb(var(--muted))] px-3 py-2.5 text-xs">
          <p className="font-mono text-[rgb(var(--foreground))]">{pending.voiceId}</p>
          {pending.prompt ? (
            <p className="mt-1 line-clamp-3 text-[rgb(var(--muted-foreground))]">{pending.prompt}</p>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={closeUnlock} className="btn-secondary flex-1">
            取消
          </button>
          <button type="button" onClick={() => void onUnlock()} disabled={busy} className="btn-primary flex-1">
            {busy ? '处理中...' : '去充值'}
          </button>
        </div>
      </div>
    </div>
  );
}
