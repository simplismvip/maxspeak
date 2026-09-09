'use client';

import { useTTSStore } from '@/lib/store/useTTSStore';
import { PRESET_VOICES } from '@/lib/voices/preset-voices';

export type TtsUiLocale = 'zh' | 'en';

function isChineseLang(value: string | undefined): boolean {
  if (!value) return false;
  return /chinese|cantonese|mandarin|yue|中文|粤/i.test(value);
}

/** Chinese labels when language boost or selected voice is Chinese; English otherwise. */
export function useTtsUiLocale(): TtsUiLocale {
  const languageBoost = useTTSStore((s) => s.languageBoost);
  const voiceId = useTTSStore((s) => s.voiceId);
  const voice = PRESET_VOICES.find((v) => v.id === voiceId);

  if (languageBoost !== 'auto') {
    return isChineseLang(languageBoost) ? 'zh' : 'en';
  }

  return isChineseLang(voice?.language) ? 'zh' : 'en';
}
