import { create } from 'zustand';

export interface AuthUser {
  email: string;
  name: string;
  image?: string;
  provider?: string;
}

interface AuthState {
  user: AuthUser | null;
  setFromSession: (user: AuthUser | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setFromSession: (user) => set({ user }),
  signOut: () => set({ user: null }),
}));
