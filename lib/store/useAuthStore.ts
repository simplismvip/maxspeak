import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (email) =>
        set({
          user: {
            email,
            name: email.split('@')[0] || '用户',
          },
        }),
      signOut: () => set({ user: null }),
    }),
    { name: 'maxspeak-auth' }
  )
);
