import { ThemeState } from "@/lib/types";
import { create } from "zustand";

export const useThemeStore = create<ThemeState>()(set => ({
  theme: "light",
  setTheme: theme => set({ theme }),
}));
