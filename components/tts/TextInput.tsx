'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { PARAM_RANGES, TTS_AUDIO_LIMITS } from '@/lib/minimax/constants';
import {
  audioOverLimitMessage,
  estimateDurationSeconds,
  formatAudioLimitLabel,
  formatEstimatedDuration,
  isOverAudioLimit,
} from '@/lib/tts/estimate-audio';

export function TextInput() {
  const text = useTTSStore((s) => s.text);
  const setText = useTTSStore((s) => s.setText);
  const speed = useTTSStore((s) => s.speed);
  const charCount = text.length;
  const estimatedSeconds = estimateDurationSeconds(text, speed);
  const overDuration = isOverAudioLimit(text, speed);
  const overChars = charCount > PARAM_RANGES.textMaxLength;
  const isOverLimit = overDuration || overChars;

  return (
    <div className="card flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="label mb-0">文本内容</label>
        <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-[rgb(var(--muted-foreground))]'}`}>
          {charCount} 字
          {text.trim() ? ` · ${formatEstimatedDuration(estimatedSeconds)} / ${formatAudioLimitLabel()}` : ` · 单次不超过 ${formatAudioLimitLabel()}`}
        </span>
      </div>
      <div className="min-h-[9rem] flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={PARAM_RANGES.textMaxLength}
          placeholder="请输入需要合成语音的文本...&#10;&#10;支持副语言标签，例如：&#10;Omg(sighs), the real danger is not that computers start thinking like people..."
          rows={6}
          className={`input-field h-full resize-none font-sans ${isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
      </div>
      {overDuration && (
        <p className="text-xs text-red-500 mt-1">
          {audioOverLimitMessage(estimatedSeconds)}
        </p>
      )}
      {!overDuration && overChars && (
        <p className="text-xs text-red-500 mt-1">
          超过字数限制，最多 {PARAM_RANGES.textMaxLength} 字符。请缩短文本后再合成。
        </p>
      )}
      {!isOverLimit && text.trim() && estimatedSeconds > TTS_AUDIO_LIMITS.maxAudioSeconds * 0.8 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          已接近单次 {formatAudioLimitLabel()} 上限，更长内容请分段生成。
        </p>
      )}
    </div>
  );
}
