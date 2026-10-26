import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Session } from '../types';

interface AuthState {
  session: Session | null;
  remember: boolean;
  setSession: (session: Session, remember: boolean) => void;
  logout: () => void;
}

const KEY = 'otd-auth';

/** "Eslab qolish" — localStorage, aks holda faqat shu tab (sessionStorage) */
const authStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name) ?? sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const remember = (JSON.parse(value) as { state?: { remember?: boolean } }).state?.remember;
      if (remember) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch {
      /* storage mavjud emas — sessiya faqat xotirada */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch {
      /* e'tiborsiz */
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      remember: true,
      setSession: (session, remember) => set({ session, remember }),
      logout: () => set({ session: null }),
    }),
    { name: KEY, storage: createJSONStorage(() => authStorage) },
  ),
);

export const getAuthToken = () => useAuthStore.getState().session?.token;
