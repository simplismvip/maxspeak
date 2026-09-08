import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '@/lib/utils';

export interface GenerationRecord {
  id: string;
  createdAt: number;
  userEmail: string;
  text: string;
  voiceId: string;
  voiceName: string;
  model: string;
  format: string;
  audioDataUrl: string;
  duration?: number;
}

const MAX_ITEMS = 20;

interface HistoryState {
  items: GenerationRecord[];
  addRecord: (item: Omit<GenerationRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => void;
  removeRecord: (id: string) => void;
  clearForUser: (userEmail: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addRecord: (item) =>
        set((state) => ({
          items: [
            {
              id: item.id || uid(),
              createdAt: item.createdAt || Date.now(),
              userEmail: item.userEmail,
              text: item.text,
              voiceId: item.voiceId,
              voiceName: item.voiceName,
              model: item.model,
              format: item.format,
              audioDataUrl: item.audioDataUrl,
              duration: item.duration,
            },
            ...state.items.filter((entry) => entry.userEmail === item.userEmail).slice(0, MAX_ITEMS - 1),
            ...state.items.filter((entry) => entry.userEmail !== item.userEmail),
          ],
        })),
      removeRecord: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clearForUser: (userEmail) =>
        set((state) => ({ items: state.items.filter((item) => item.userEmail !== userEmail) })),
    }),
    { name: 'voxify-generation-history' },
  ),
);

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
