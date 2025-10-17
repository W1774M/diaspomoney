import { AuthState } from '@/types';
import { create } from 'zustand';

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setError: error => set({ error }),
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        set({
          isLoading: false,
          error: null,
          user: data.user,
          isAuthenticated: true,
        });
      } else {
        if (data.error === 'user_not_found') {
          set({
            isLoading: false,
            error: 'Aucun compte trouvé. Veuillez vous enregistrer.',
          });
        } else if (data.error === 'invalid_password') {
          set({
            isLoading: false,
            error: 'Mot de passe incorrect.',
          });
        } else {
          set({
            isLoading: false,
            error: 'Erreur lors de la connexion',
          });
        }
      }
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  },
  logout: async () => {
    set({ user: null, isAuthenticated: false, error: null });
  },
  register: async userData => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (res.ok) {
        set({
          isLoading: false,
          error: null,
          user: data.user,
          isAuthenticated: true,
        });
      } else {
        set({
          isLoading: false,
          error: data.error || "Erreur lors de l'inscription",
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  },
}));
