import { create } from "zustand";

interface AuthState {
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  setError: (error) => set({ error }),
  login: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    email,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    password
  ) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implémenter la logique d'authentification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
      throw error;
    }
  },
}));
