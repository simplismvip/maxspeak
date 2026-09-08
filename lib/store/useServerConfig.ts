import { create } from 'zustand';

interface ServerConfigState {
  hasServerKey: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
}

export const useServerConfig = create<ServerConfigState>((set) => ({
  hasServerKey: false,
  loaded: false,
  refresh: async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) {
        set({ hasServerKey: false, loaded: true });
        return;
      }
      const data = await res.json();
      set({ hasServerKey: Boolean(data.hasServerKey), loaded: true });
    } catch {
      set({ hasServerKey: false, loaded: true });
    }
  },
}));
