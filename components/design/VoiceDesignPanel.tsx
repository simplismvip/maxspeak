'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleDollarSign, Clock, Sparkles, WandSparkles } from 'lucide-react';
import { minimaxHeaders } from '@/lib/minimax/request';
import type { DesignedVoice } from '@/lib/minimax/types';
import { HelpTip } from '@/components/ui/HelpTip';
import { isDesignedVoicePaid, useDesignedVoiceStore } from '@/lib/store/useDesignedVoiceStore';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function hexToAudioUrl(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

export function VoiceDesignPanel() {
  const [prompt, setPrompt] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [isDesigning, setIsDesigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    voiceId: string;
    trialAudio: string;
  } | null>(null);
  const [designedVoices, setDesignedVoices] = useState<DesignedVoice[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('tts-designed-voices') || '[]');
      } catch { return []; }
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState<'prompt' | 'preview' | null>(null);
  const unlocked = useDesignedVoiceStore((s) => s.unlocked);
  const openUnlock = useDesignedVoiceStore((s) => s.openUnlock);
  const refreshDesigned = useDesignedVoiceStore((s) => s.refresh);

  const saveDesignedVoices = (voices: DesignedVoice[]) => {
    setDesignedVoices(voices);
    localStorage.setItem('tts-designed-voices', JSON.stringify(voices));
  };

  const handleDesign = async () => {
    if (!prompt.trim() || !previewText.trim()) return;
    if (prompt.length > 500) {
      setError('提示词不能超过 500 个字符');
      return;
    }

    setError(null);
    setIsDesigning(true);

    try {
      const body = {
        prompt: prompt.trim(),
        preview_text: previewText.trim(),
        ...(voiceId.trim() ? { voice_id: voiceId.trim() } : {}),
      };

      const res = await fetch('/api/voice-design', {
        method: 'POST',
        headers: minimaxHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Voice design failed');
      }

      const data = await res.json();

      setResult({
        voiceId: data.voice_id,
        trialAudio: data.trial_audio,
      });

      // Save to local list
      const newVoice: DesignedVoice = {
        voiceId: data.voice_id,
        prompt: prompt.trim(),
        previewText: previewText.trim(),
        createdAt: Date.now(),
        trialAudio: data.trial_audio,
      };
      saveDesignedVoices([newVoice, ...designedVoices]);
      void refreshDesigned();

      // Auto-play trial audio
      if (data.trial_audio) {
        try {
          const url = hexToAudioUrl(data.trial_audio);
          new Audio(url).play().catch(() => {});
        } catch { /* playback failure is non-critical */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Design error');
    } finally {
      setIsDesigning(false);
    }
  };

  const handleGenerateCopy = async (field: 'prompt' | 'preview') => {
    setError(null);
    setIsGenerating(field);
    try {
      const hint = field === 'prompt' ? prompt : previewText || prompt;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: minimaxHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ field, hint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      const text = String(data.text || '').trim();
      if (!text) throw new Error('模型没有返回可用文本');
      if (field === 'prompt') setPrompt(text.slice(0, 500));
      else setPreviewText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setPreviewText('');
    setVoiceId('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[rgb(var(--foreground))]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10">
            <Sparkles size={16} className="text-amber-500" />
          </div>
          Voice Design
        </h2>
        <p className="ml-[42px] mt-1.5 text-sm text-[rgb(var(--muted-foreground))]">
          通过文字描述来创造全新的音色，无需音频样本。
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-950 dark:text-amber-100">
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            <CircleDollarSign size={15} className="shrink-0" />
            收费说明
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed">
            <li>设计音色是付费项目：解锁一条设计音色需单独付费，买下后可反复使用。</li>
            <li>
              本页可以先设计和试听，不收解锁费。第一次在「<Link href="/text-to-speech" className="underline underline-offset-2 hover:text-brand">生成语音</Link>」里用这条音色时，才按一条音色扣费。本页试听不算解锁。
            </li>
            <li>解锁之后再用，只按普通语音合成计费，不再收解锁费。</li>
          </ul>
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            <Clock size={15} className="shrink-0" />
            请在 7 天内用一次
          </p>
          <p className="mt-2 text-[13px] leading-relaxed">
            新设计的音色会先暂存 7 天。请在 7 天内到「生成语音」用一次，才会留下来。本页试听不能激活保留，逾期未用会被清除。
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-xs underline mt-1">关闭</button>
          </div>
        </div>
      )}

      {!result ? (
        <div className="card p-6 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[rgb(var(--muted-foreground))]">
              <span>音色描述</span>
              <HelpTip label="设计技巧" title="设计技巧">
                <ul className="list-disc space-y-0.5 pl-4 text-[rgb(var(--muted-foreground))]">
                  <li>描述性别、年龄、语气风格</li>
                  <li>可指定语速、音高特征</li>
                  <li>可描述情感特点（温柔/活泼/沉稳/激昂）</li>
                  <li>可指定使用场景（播音/朗读/对话/配音）</li>
                </ul>
              </HelpTip>
              <span className="font-normal tracking-normal">({prompt.length}/500)</span>
            </div>
            <p className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">
              告诉系统你想要什么样的声音，例如性别、年龄、语气和使用场景。设计接口会按这段描述生成音色。
            </p>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：温柔知性的女性声音，语速适中，适合朗读散文"
                rows={4}
                className="input-field resize-none pb-11"
                maxLength={500}
              />
              <button
                type="button"
                onClick={() => void handleGenerateCopy('prompt')}
                disabled={isGenerating !== null || isDesigning}
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/25 disabled:opacity-50"
              >
                <WandSparkles size={12} />
                {isGenerating === 'prompt' ? '生成中...' : 'AI 生成'}
              </button>
            </div>
          </div>

          <div>
            <label className="label">预览文本</label>
            <p className="mb-2 text-xs text-[rgb(var(--muted-foreground))]">
              设计完成后用来试听的那段话。系统会用新音色朗读它，方便你判断效果。
            </p>
            <div className="relative">
              <textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="输入一段会被朗读的试听文案..."
                rows={3}
                className="input-field resize-none pb-11"
              />
              <button
                type="button"
                onClick={() => void handleGenerateCopy('preview')}
                disabled={isGenerating !== null || isDesigning}
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/25 disabled:opacity-50"
              >
                <WandSparkles size={12} />
                {isGenerating === 'preview' ? '生成中...' : 'AI 生成'}
              </button>
            </div>
          </div>

          <div>
            <label className="label">自定义音色 ID（可选）</label>
            <input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="留空则自动生成 ttv-voice- 前缀的 ID"
              className="input-field font-mono text-sm"
            />
          </div>

          <p className="text-xs leading-relaxed text-[rgb(var(--muted-foreground))]">
            本页试听不收解锁费。生成后请在 7 天内到「生成语音」使用一次才会保留；第一次合成时按一条音色扣费。
          </p>

          <button
            onClick={handleDesign}
            disabled={!prompt.trim() || !previewText.trim() || isDesigning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isDesigning ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                设计中...
              </>
            ) : (
              <>
                <span>✨</span> 生成音色
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">✨</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">音色设计完成!</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              音色 ID: <code className="font-mono text-primary-600">{result.voiceId}</code>
            </p>
          </div>

          {/* Trial Audio */}
          {result.trialAudio && (
            <div>
              <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">试听预览：</p>
              <button
                onClick={() => {
                  try {
                    const url = hexToAudioUrl(result.trialAudio);
                    new Audio(url).play().catch(() => {});
                  } catch {}
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <span>▶</span> 播放试听音频
              </button>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <p>这条音色先暂存 7 天。请到「生成语音」用一次才会留下；本页试听不算。</p>
            <p>第一次用于合成时按一条音色扣费，之后再用只按普通语音合成计费。</p>
          </div>

          <button onClick={handleReset} className="btn-primary w-full">
            设计另一个音色
          </button>
        </div>
      )}

      {/* Designed Voices List */}
      {designedVoices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-3">
            已设计的音色 ({designedVoices.length})
          </h3>
          <div className="space-y-2">
            {designedVoices.map((voice) => (
              <div key={voice.voiceId} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="text-sm font-medium text-[rgb(var(--foreground))] font-mono truncate">{voice.voiceId}</div>
                    {!isDesignedVoicePaid(voice.voiceId, unlocked) ? (
                      <button
                        type="button"
                        onClick={() => openUnlock({ voiceId: voice.voiceId, prompt: voice.prompt })}
                        className="flex-shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-200"
                      >
                        付费
                      </button>
                    ) : null}
                  </div>
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">
                    {new Date(voice.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
                  {Date.now() - voice.createdAt > SEVEN_DAYS_MS
                    ? '已超过 7 天，若未在生成语音中用过，可能已被平台删除。'
                    : '临时音色：7 天内请到「生成语音」使用一次才会留下，本页试听不算。'}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2 line-clamp-2">
                  描述: {voice.prompt}
                </p>
                <div className="flex gap-2">
                  {voice.trialAudio && (
                    <button
                      onClick={() => {
                        try {
                          const url = hexToAudioUrl(voice.trialAudio!);
                          new Audio(url).play().catch(() => {});
                        } catch {}
                      }}
                      className="btn-ghost text-xs"
                    >
                      ▶ 试听
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const updated = designedVoices.filter(v => v.voiceId !== voice.voiceId);
                      saveDesignedVoices(updated);
                    }}
                    className="btn-ghost text-xs text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
