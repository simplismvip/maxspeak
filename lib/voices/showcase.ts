import { PRESET_VOICES } from '@/lib/voices/preset-voices';
import type { PresetVoice } from '@/lib/minimax/types';

const SHOWCASE_IDS = [
  'Chinese (Mandarin)_Warm_Bestie',
  'Chinese (Mandarin)_Reliable_Executive',
  'Arrogant_Miss',
  'Chinese (Mandarin)_Radio_Host',
  'Chinese (Mandarin)_Cute_Spirit',
  'Chinese (Mandarin)_Gentle_Youth',
  'English_radiant_girl',
  'English_magnetic_voiced_man',
  'Chinese (Mandarin)_Sweet_Lady',
  'Chinese (Mandarin)_Unrestrained_Young_Man',
  'English_CalmWoman',
  'Chinese (Mandarin)_HK_Flight_Attendant',
];

export const SHOWCASE_LANGUAGE_LABEL = '中文、英语、法语等';

export function getShowcaseVoices(): PresetVoice[] {
  const byId = new Map(PRESET_VOICES.map((voice) => [voice.id, voice]));
  return SHOWCASE_IDS.map((id) => byId.get(id)).filter((voice): voice is PresetVoice => Boolean(voice));
}

export function voiceAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=142024,0e181b&radius=50`;
}
