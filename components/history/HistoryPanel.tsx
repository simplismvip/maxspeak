'use client';

import { History, Play, Download, Trash2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useHistoryStore } from '@/lib/store/useHistoryStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { LoginRequiredState } from '@/components/auth/LoginRequiredState';
import { formatDuration } from '@/lib/utils';
import { formatToExtension as audioExt } from '@/lib/audio/utils';
import { PRESET_VOICES } from '@/lib/voices/preset-voices';
import { resolveVoiceSource } from '@/lib/voices/custom-voices';

export function HistoryPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useHistoryStore((s) => s.items);
  const removeRecord = useHistoryStore((s) => s.removeRecord);
  const setAudioUrl = usePlayerStore((s) => s.setAudioUrl);
  const setLastGeneratedAudio = usePlayerStore((s) => s.setLastGeneratedAudio);
  const setText = useTTSStore((s) => s.setText);
  const selectVoiceFromLibrary = useTTSStore((s) => s.selectVoiceFromLibrary);

  const records = user ? items.filter((item) => item.userEmail === user.email) : [];

  const play = (record: (typeof records)[number]) => {
    setAudioUrl(record.audioDataUrl);
    setLastGeneratedAudio({
      url: record.audioDataUrl,
      format: record.format,
      fileName: `tts-${record.id}.${audioExt(record.format)}`,
    });
    requestAnimationFrame(() => {
      (window as unknown as { __audioPlayerPlay?: () => void }).__audioPlayerPlay?.();
    });
  };

  const reuse = (record: (typeof records)[number]) => {
    setText(record.text);
    const preset = PRESET_VOICES.find((voice) => voice.id === record.voiceId);
    if (preset) {
      selectVoiceFromLibrary({
        voiceId: preset.id,
        source: 'system',
        language: preset.language,
        gender: preset.gender,
      });
    } else {
      selectVoiceFromLibrary({
        voiceId: record.voiceId,
        source: resolveVoiceSource(record.voiceId),
      });
    }
    play(record);
    router.push('/text-to-speech');
  };

  const download = (record: (typeof records)[number]) => {
    const link = document.createElement('a');
    link.href = record.audioDataUrl;
    link.download = `tts-${record.id}.${audioExt(record.format)}`;
    link.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[rgb(var(--foreground))]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/10">
            <History size={16} className="text-sky-500" />
          </div>
          生成历史
        </h2>
        <p className="ml-[42px] mt-1.5 text-sm text-[rgb(var(--muted-foreground))]">
          回放和复用每次合成任务
        </p>
      </div>

      {!user ? (
        <LoginRequiredState
          title="登录后查看生成历史"
          description="生成历史仅对您的登录账户可见。"
        />
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-6 py-16 text-center">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">暂无生成记录</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
            去「生成语音」合成后，任务会出现在这里。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[rgb(var(--foreground))]">{record.voiceName}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[rgb(var(--muted-foreground))]">{record.text}</p>
                <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
                  {new Date(record.createdAt).toLocaleString('zh-CN')}
                  {record.duration ? ` · ${formatDuration(record.duration)}` : ''}
                  {` · ${record.model}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <button type="button" onClick={() => play(record)} className="btn-ghost text-xs">
                  <Play size={12} /> 播放
                </button>
                <button type="button" onClick={() => reuse(record)} className="btn-ghost text-xs">
                  <RotateCcw size={12} /> 复用
                </button>
                <button type="button" onClick={() => download(record)} className="btn-ghost text-xs">
                  <Download size={12} /> 下载
                </button>
                <button
                  type="button"
                  onClick={() => removeRecord(record.id)}
                  className="btn-ghost text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
