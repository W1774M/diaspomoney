import { ThemeState } from "@/types";
import { create } from "zustand";

export const useThemeStore = create<ThemeState>()(set => ({
  theme: "system",
  setTheme: theme => set({ theme }),
}));
