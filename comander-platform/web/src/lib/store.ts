import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { DEMO_USER } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  token: string | null;
  introSeen: boolean; // si ya vio el splash/intro en esta sesión de navegador
  login: (email: string) => void;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  setIntroSeen: (v: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      introSeen: false,
      // Login demo (respaldo si el backend no está disponible).
      login: (email: string) =>
        set({
          user: { ...DEMO_USER, email: email || DEMO_USER.email },
          token: 'demo-token',
        }),
      // Sesión real contra el backend NestJS.
      setSession: (user: User, token: string) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setIntroSeen: (v) => set({ introSeen: v }),
    }),
    {
      name: 'comander-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: 'comander-ui' }
  )
);

// ───────── Preferencias / Configuración por usuario (persistidas) ─────────
export type ThemeId = 'commander' | 'azul' | 'oscuro' | 'verde' | 'naranja' | 'morado';

interface SettingsState {
  themeId: ThemeId;
  animationsEnabled: boolean;
  introEnabled: boolean;
  reportsEnabled: boolean;
  /** Modo privacidad: oculta todos los valores monetarios de la app. */
  balancesHidden: boolean;
  setThemeId: (id: ThemeId) => void;
  setAnimationsEnabled: (v: boolean) => void;
  setIntroEnabled: (v: boolean) => void;
  setReportsEnabled: (v: boolean) => void;
  setBalancesHidden: (v: boolean) => void;
  toggleBalances: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeId: 'commander',
      animationsEnabled: true,
      introEnabled: true,
      reportsEnabled: false, // los reportes están desactivados por defecto
      balancesHidden: false,
      setThemeId: (themeId) => set({ themeId }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setIntroEnabled: (introEnabled) => set({ introEnabled }),
      setReportsEnabled: (reportsEnabled) => set({ reportsEnabled }),
      setBalancesHidden: (balancesHidden) => set({ balancesHidden }),
      toggleBalances: () => set((s) => ({ balancesHidden: !s.balancesHidden })),
    }),
    {
      name: 'comander-settings',
      partialize: (s) => ({
        themeId: s.themeId,
        animationsEnabled: s.animationsEnabled,
        introEnabled: s.introEnabled,
        reportsEnabled: s.reportsEnabled,
        balancesHidden: s.balancesHidden,
      }),
    }
  )
);
