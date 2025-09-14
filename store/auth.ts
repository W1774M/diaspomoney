import { AuthState } from "@/types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>(set => ({
  isLoading: false,
  error: null,
  setError: error => set({ error }),
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        set({ isLoading: false, error: null });
        return true;
      } else {
        if (data.error === "user_not_found") {
          set({
            isLoading: false,
            error: "Aucun compte trouvé. Veuillez vous enregistrer.",
          });
        } else if (data.error === "invalid_password") {
          set({
            isLoading: false,
            error: "Mot de passe incorrect.",
          });
        } else {
          set({
            isLoading: false,
            error: "Erreur lors de la connexion",
          });
        }
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
      return false;
    }
  },
}));
