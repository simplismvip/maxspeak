'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTTSStore } from '@/lib/store/useTTSStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { PRESET_VOICES, VOICE_LANGUAGES, filterVoices, pinVoiceFirst } from '@/lib/voices/preset-voices';
import {
  loadClonedVoices,
  loadDesignedVoices,
  playDesignedTrialAudio,
  type VoicePickerSource,
} from '@/lib/voices/custom-voices';
import { VoiceCard } from './VoiceCard';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PresetVoice, ClonedVoice, DesignedVoice } from '@/lib/minimax/types';
import { isDesignedVoicePaid, useDesignedVoiceStore } from '@/lib/store/useDesignedVoiceStore';

interface Props {
  onPreviewVoice?: (voiceId: string) => void;
  previewLoading?: string | null;
}

const TABS: { id: VoicePickerSource; label: string }[] = [
  { id: 'system', label: '系统音色' },
  { id: 'cloned', label: '复刻音色' },
  { id: 'designed', label: '设计音色' },
];

function clonedToPreset(voice: ClonedVoice): PresetVoice {
  return {
    id: voice.voiceId,
    name: voice.name || voice.voiceId,
    language: 'Custom',
    languageLabel: '复刻',
    gender: 'neutral',
    description: new Date(voice.createdAt).toLocaleString('zh-CN'),
    tags: ['复刻'],
  };
}

function designedToPreset(voice: DesignedVoice): PresetVoice {
  return {
    id: voice.voiceId,
    name: voice.voiceId,
    language: 'Custom',
    languageLabel: '设计',
    gender: 'neutral',
    description: voice.prompt,
    tags: ['设计'],
  };
}

export function VoiceSelector({ onPreviewVoice, previewLoading }: Props) {
  const voiceId = useTTSStore((s) => s.voiceId);
  const setVoiceId = useTTSStore((s) => s.setVoiceId);
  const voiceSource = useTTSStore((s) => s.voiceSource);
  const setVoiceSource = useTTSStore((s) => s.setVoiceSource);
  const language = useTTSStore((s) => s.voiceLanguage);
  const setLanguage = useTTSStore((s) => s.setVoiceLanguage);
  const gender = useTTSStore((s) => s.voiceGender);
  const setGender = useTTSStore((s) => s.setVoiceGender);
  const user = useAuthStore((s) => s.user);
  const unlocked = useDesignedVoiceStore((s) => s.unlocked);
  const openUnlock = useDesignedVoiceStore((s) => s.openUnlock);

  const [search, setSearch] = useState('');
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>([]);

  useEffect(() => {
    setClonedVoices(loadClonedVoices());
    setDesignedVoices(loadDesignedVoices());
  }, [voiceSource]);

  const systemVoices = useMemo(
    () => pinVoiceFirst(
      filterVoices(PRESET_VOICES, language || undefined, search || undefined, gender || undefined),
      voiceId
    ),
    [language, search, gender, voiceId]
  );

  const clonedList = useMemo(
    () => pinVoiceFirst(clonedVoices.map(clonedToPreset), voiceId),
    [clonedVoices, voiceId]
  );

  const designedList = useMemo(
    () => pinVoiceFirst(designedVoices.map(designedToPreset), voiceId),
    [designedVoices, voiceId]
  );

  const visibleVoices =
    voiceSource === 'system' ? systemVoices : voiceSource === 'cloned' ? clonedList : designedList;

  const handlePreview = (id: string) => {
    const cloned = clonedVoices.find((voice) => voice.voiceId === id);
    if (cloned?.demoAudio) {
      try {
        const audio = new Audio(cloned.demoAudio);
        audio.play().catch(() => {});
      } catch { /* ignore */ }
      return;
    }
    const designed = designedVoices.find((voice) => voice.voiceId === id);
    if (designed?.trialAudio) {
      playDesignedTrialAudio(designed.trialAudio);
      return;
    }
    onPreviewVoice?.(id);
  };

  return (
    <div className="card flex flex-col p-3">
      <label className="label">音色选择</label>

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-[rgb(var(--muted))] p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setVoiceSource(tab.id)}
            className={cn(
              'rounded-md px-2 py-1.5 text-[11px] font-medium transition-all',
              voiceSource === tab.id
                ? 'bg-white text-[rgb(var(--foreground))] shadow-sm dark:bg-slate-600'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {voiceSource === 'system' && (
        <>
          <div className="relative mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索音色..."
              className="input-field pl-8 text-sm"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
          </div>
          <div className="mb-3 flex gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field flex-1 py-1 text-xs"
            >
              <option value="">全部语言</option>
              {VOICE_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="input-field w-28 py-1 text-xs"
            >
              <option value="">全部</option>
              <option value="male">男声</option>
              <option value="female">女声</option>
              <option value="neutral">中性</option>
            </select>
          </div>
        </>
      )}

      {voiceSource !== 'system' && !user ? (
        <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
          <p className="text-sm font-medium text-[rgb(var(--foreground))]">
            {voiceSource === 'cloned' ? '登录后查看复刻音色' : '登录后查看设计音色'}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
            {voiceSource === 'cloned'
              ? '复刻音色仅对登录账户可见'
              : '设计音色仅对登录账户可见'}
          </p>
          <Link href="/signin?next=%2Ftext-to-speech" className="btn-primary mt-4 px-5 text-sm">
            登录
          </Link>
        </div>
      ) : (
        <div className="max-h-64 min-h-0 space-y-1 overflow-y-auto scrollbar-thin">
          {visibleVoices.length === 0 && (
            <p className="py-8 text-center text-xs text-[rgb(var(--muted-foreground))]">
              {voiceSource === 'cloned'
                ? '暂无复刻音色'
                : voiceSource === 'designed'
                  ? '暂无设计音色'
                  : '未找到匹配的音色'}
            </p>
          )}
          {visibleVoices.slice(0, 100).map((voice) => {
            const designed = designedVoices.find((item) => item.voiceId === voice.id);
            const needsUnlock = voiceSource === 'designed' && !isDesignedVoicePaid(voice.id, unlocked);
            return (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={voice.id === voiceId}
              needsUnlock={needsUnlock}
              onSelect={() => {
                if (needsUnlock) {
                  openUnlock({ voiceId: voice.id, prompt: designed?.prompt });
                  return;
                }
                setVoiceId(voice.id);
              }}
              onPreview={handlePreview}
              previewLoading={previewLoading === voice.id}
            />
            );
          })}
          {visibleVoices.length > 100 && (
            <p className="py-2 text-center text-xs text-[rgb(var(--muted-foreground))]">
              显示前 100 个结果，请使用搜索或过滤缩小范围
            </p>
          )}
        </div>
      )}
    </div>
  );
}
