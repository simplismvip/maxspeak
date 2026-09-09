import type { ClonedVoice, DesignedVoice } from '@/lib/minimax/types';
import { PRESET_VOICES } from '@/lib/voices/preset-voices';

export type VoicePickerSource = 'system' | 'cloned' | 'designed';

export function loadClonedVoices(): ClonedVoice[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('tts-cloned-voices') || '[]');
  } catch {
    return [];
  }
}

export function loadDesignedVoices(): DesignedVoice[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('tts-designed-voices') || '[]');
  } catch {
    return [];
  }
}

export function resolveVoiceSource(voiceId: string): VoicePickerSource {
  if (PRESET_VOICES.some((voice) => voice.id === voiceId)) return 'system';
  if (loadClonedVoices().some((voice) => voice.voiceId === voiceId)) return 'cloned';
  if (loadDesignedVoices().some((voice) => voice.voiceId === voiceId)) return 'designed';
  return 'system';
}

export function findVoiceName(voiceId: string): string {
  const preset = PRESET_VOICES.find((voice) => voice.id === voiceId);
  if (preset) return preset.name;
  const cloned = loadClonedVoices().find((voice) => voice.voiceId === voiceId);
  if (cloned) return cloned.name || cloned.voiceId;
  const designed = loadDesignedVoices().find((voice) => voice.voiceId === voiceId);
  if (designed) return designed.voiceId;
  return voiceId;
}

export function playDesignedTrialAudio(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  audio.play().catch(() => {});
}
