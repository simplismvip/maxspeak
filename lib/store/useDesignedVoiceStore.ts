import { create } from 'zustand';
import { loadDesignedVoices } from '@/lib/voices/custom-voices';

type DesignedUnlockMap = Record<string, boolean>;

type PendingUnlock = {
  voiceId: string;
  prompt?: string;
};

interface DesignedVoiceState {
  unlocked: DesignedUnlockMap;
  loaded: boolean;
  pending: PendingUnlock | null;
  refresh: () => Promise<void>;
  markUnlocked: (voiceId: string) => void;
  openUnlock: (voice: PendingUnlock) => void;
  closeUnlock: () => void;
}

export const useDesignedVoiceStore = create<DesignedVoiceState>((set, get) => ({
  unlocked: {},
  loaded: false,
  pending: null,
  refresh: async () => {
    const local = loadDesignedVoices();
    try {
      if (local.length > 0) {
        await fetch('/api/voices/designed/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voices: local.map((voice) => ({
              voiceId: voice.voiceId,
              prompt: voice.prompt,
              createdAt: voice.createdAt,
            })),
          }),
        });
      }
      const res = await fetch('/api/voices/designed');
      if (!res.ok) {
        set({ loaded: true });
        return;
      }
      const data = await res.json();
      const unlocked: DesignedUnlockMap = {};
      for (const voice of data.voices || []) {
        if (typeof voice.voiceId === 'string') unlocked[voice.voiceId] = Boolean(voice.unlocked);
      }
      set({ unlocked, loaded: true });
    } catch {
      set({ loaded: true, unlocked: get().unlocked });
    }
  },
  markUnlocked: (voiceId) => {
    set((state) => ({ unlocked: { ...state.unlocked, [voiceId]: true } }));
  },
  openUnlock: (voice) => set({ pending: voice }),
  closeUnlock: () => set({ pending: null }),
}));

export function isDesignedVoicePaid(voiceId: string, unlocked: DesignedUnlockMap) {
  return Boolean(unlocked[voiceId]);
}
