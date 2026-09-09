import { TTS_AUDIO_LIMITS } from '@/lib/minimax/constants';

const TAG_RE = /\([^)]{1,40}\)/g;

function isCjkLike(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x3040 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

/** Estimate spoken duration from text at the given TTS speed (1.0 = default). */
export function estimateDurationSeconds(text: string, speed = 1): number {
  if (!text.trim()) return 0;
  const tags = text.match(TAG_RE) ?? [];
  const spoken = text.replace(TAG_RE, ' ');
  let cjk = 0;
  let latin = 0;
  for (const ch of spoken) {
    const code = ch.charCodeAt(0);
    if (isCjkLike(code)) cjk += 1;
    else if (!/\s/.test(ch)) latin += 1;
  }
  const rate = Math.max(Number(speed) || 1, 0.5);
  const spokenSec =
    cjk / TTS_AUDIO_LIMITS.cjkCharsPerSecond + latin / TTS_AUDIO_LIMITS.latinCharsPerSecond;
  const pauseSec = tags.length * TTS_AUDIO_LIMITS.tagPauseSeconds;
  return (spokenSec + pauseSec) / rate;
}

export function isOverAudioLimit(text: string, speed = 1): boolean {
  return estimateDurationSeconds(text, speed) > TTS_AUDIO_LIMITS.maxAudioSeconds;
}

/** Human-readable duration, e.g. "约 42 秒" / "约 4 分 20 秒". */
export function formatEstimatedDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  if (m === 0) return `约 ${s} 秒`;
  if (s === 0) return `约 ${m} 分钟`;
  return `约 ${m} 分 ${s} 秒`;
}

export function formatAudioLimitLabel(): string {
  const cap = TTS_AUDIO_LIMITS.maxAudioSeconds;
  if (cap % 60 === 0) return `${cap / 60} 分钟`;
  return formatEstimatedDuration(cap).replace(/^约 /, '');
}

export function audioOverLimitMessage(seconds: number): string {
  return `预估时长 ${formatEstimatedDuration(seconds).replace(/^约 /, '')}，单次合成建议不超过 ${formatAudioLimitLabel()}。请缩短文本或分段生成。`;
}
