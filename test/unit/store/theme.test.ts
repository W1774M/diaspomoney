import { describe, expect, it, beforeEach, vi } from "vitest";
import { useThemeStore } from "@/store/theme";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Theme Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useThemeStore.setState({ theme: "system" });
  });

  it("should have initial theme as system", () => {
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("system");
  });

  it("should set theme correctly", () => {
    const { setTheme } = useThemeStore.getState();
    
    setTheme("light");
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("light");
  });

  it("should set theme to dark", () => {
    const { setTheme } = useThemeStore.getState();
    
    setTheme("dark");
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("dark");
  });

  it("should set theme to system", () => {
    const { setTheme } = useThemeStore.getState();
    
    // First set to light
    setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
    
    // Then set to system
    setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");
  });

  it("should handle multiple theme changes", () => {
    const { setTheme } = useThemeStore.getState();
    
    setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
    
    setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    
    setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");
    
    setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("should handle rapid theme changes", () => {
    const { setTheme } = useThemeStore.getState();
    
    // Rapid changes
    setTheme("light");
    setTheme("dark");
    setTheme("system");
    setTheme("light");
    
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("should handle invalid theme values gracefully", () => {
    const { setTheme } = useThemeStore.getState();
    
    // @ts-ignore - Testing invalid input
    setTheme("invalid-theme");
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("invalid-theme");
  });

  it("should handle empty string theme", () => {
    const { setTheme } = useThemeStore.getState();
    
    setTheme("");
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe("");
  });

  it("should handle null theme", () => {
    const { setTheme } = useThemeStore.getState();
    
    // @ts-ignore - Testing null input
    setTheme(null);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(null);
  });

  it("should handle undefined theme", () => {
    const { setTheme } = useThemeStore.getState();
    
    // @ts-ignore - Testing undefined input
    setTheme(undefined);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(undefined);
  });

  it("should handle boolean theme values", () => {
    const { setTheme } = useThemeStore.getState();
    
    // @ts-ignore - Testing boolean input
    setTheme(true);
    expect(useThemeStore.getState().theme).toBe(true);
    
    // @ts-ignore - Testing boolean input
    setTheme(false);
    expect(useThemeStore.getState().theme).toBe(false);
  });

  it("should handle numeric theme values", () => {
    const { setTheme } = useThemeStore.getState();
    
    // @ts-ignore - Testing numeric input
    setTheme(42);
    expect(useThemeStore.getState().theme).toBe(42);
    
    // @ts-ignore - Testing numeric input
    setTheme(0);
    expect(useThemeStore.getState().theme).toBe(0);
  });

  it("should handle object theme values", () => {
    const { setTheme } = useThemeStore.getState();
    
    const themeObject = { name: "custom", variant: "dark" };
    // @ts-ignore - Testing object input
    setTheme(themeObject);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toEqual(themeObject);
  });

  it("should handle array theme values", () => {
    const { setTheme } = useThemeStore.getState();
    
    const themeArray = ["light", "dark", "system"];
    // @ts-ignore - Testing array input
    setTheme(themeArray);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toEqual(themeArray);
  });

  it("should handle function theme values", () => {
    const { setTheme } = useThemeStore.getState();
    
    const themeFunction = () => "dynamic-theme";
    // @ts-ignore - Testing function input
    setTheme(themeFunction);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(themeFunction);
  });

  it("should maintain theme state between store accesses", () => {
    const { setTheme } = useThemeStore.getState();
    
    setTheme("light");
    
    // Access store multiple times
    const theme1 = useThemeStore.getState().theme;
    const theme2 = useThemeStore.getState().theme;
    const theme3 = useThemeStore.getState().theme;
    
    expect(theme1).toBe("light");
    expect(theme2).toBe("light");
    expect(theme3).toBe("light");
  });

  it("should handle theme with special characters", () => {
    const { setTheme } = useThemeStore.getState();
    
    const specialTheme = "theme-with-special-chars@#$%^&*()";
    setTheme(specialTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(specialTheme);
  });

  it("should handle very long theme names", () => {
    const { setTheme } = useThemeStore.getState();
    
    const longTheme = "a".repeat(1000);
    setTheme(longTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(longTheme);
  });

  it("should handle unicode theme names", () => {
    const { setTheme } = useThemeStore.getState();
    
    const unicodeTheme = "thème-éèàç";
    setTheme(unicodeTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(unicodeTheme);
  });

  it("should handle HTML-like theme names", () => {
    const { setTheme } = useThemeStore.getState();
    
    const htmlTheme = "<script>alert('theme')</script>";
    setTheme(htmlTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(htmlTheme);
  });

  it("should handle theme names with spaces", () => {
    const { setTheme } = useThemeStore.getState();
    
    const spacedTheme = "light theme with spaces";
    setTheme(spacedTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(spacedTheme);
  });

  it("should handle theme names with numbers", () => {
    const { setTheme } = useThemeStore.getState();
    
    const numericTheme = "theme-123";
    setTheme(numericTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(numericTheme);
  });

  it("should handle mixed case theme names", () => {
    const { setTheme } = useThemeStore.getState();
    
    const mixedTheme = "LiGhT-tHeMe";
    setTheme(mixedTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(mixedTheme);
  });

  it("should handle theme names with underscores", () => {
    const { setTheme } = useThemeStore.getState();
    
    const underscoreTheme = "light_theme";
    setTheme(underscoreTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(underscoreTheme);
  });

  it("should handle theme names with dots", () => {
    const { setTheme } = useThemeStore.getState();
    
    const dotTheme = "light.theme";
    setTheme(dotTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(dotTheme);
  });

  it("should handle theme names with hyphens", () => {
    const { setTheme } = useThemeStore.getState();
    
    const hyphenTheme = "light-theme";
    setTheme(hyphenTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(hyphenTheme);
  });

  it("should handle theme names with forward slashes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const slashTheme = "light/theme";
    setTheme(slashTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(slashTheme);
  });

  it("should handle theme names with backslashes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const backslashTheme = "light\\theme";
    setTheme(backslashTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(backslashTheme);
  });

  it("should handle theme names with quotes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const quoteTheme = 'light"theme';
    setTheme(quoteTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(quoteTheme);
  });

  it("should handle theme names with single quotes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const singleQuoteTheme = "light'theme";
    setTheme(singleQuoteTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(singleQuoteTheme);
  });

  it("should handle theme names with parentheses", () => {
    const { setTheme } = useThemeStore.getState();
    
    const parenTheme = "light(theme)";
    setTheme(parenTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(parenTheme);
  });

  it("should handle theme names with brackets", () => {
    const { setTheme } = useThemeStore.getState();
    
    const bracketTheme = "light[theme]";
    setTheme(bracketTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(bracketTheme);
  });

  it("should handle theme names with braces", () => {
    const { setTheme } = useThemeStore.getState();
    
    const braceTheme = "light{theme}";
    setTheme(braceTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(braceTheme);
  });

  it("should handle theme names with angle brackets", () => {
    const { setTheme } = useThemeStore.getState();
    
    const angleTheme = "light<theme>";
    setTheme(angleTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(angleTheme);
  });

  it("should handle theme names with pipe characters", () => {
    const { setTheme } = useThemeStore.getState();
    
    const pipeTheme = "light|theme";
    setTheme(pipeTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(pipeTheme);
  });

  it("should handle theme names with ampersands", () => {
    const { setTheme } = useThemeStore.getState();
    
    const ampTheme = "light&theme";
    setTheme(ampTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(ampTheme);
  });

  it("should handle theme names with equals signs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const equalsTheme = "light=theme";
    setTheme(equalsTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(equalsTheme);
  });

  it("should handle theme names with plus signs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const plusTheme = "light+theme";
    setTheme(plusTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(plusTheme);
  });

  it("should handle theme names with minus signs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const minusTheme = "light-theme";
    setTheme(minusTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(minusTheme);
  });

  it("should handle theme names with asterisks", () => {
    const { setTheme } = useThemeStore.getState();
    
    const asteriskTheme = "light*theme";
    setTheme(asteriskTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(asteriskTheme);
  });

  it("should handle theme names with hash symbols", () => {
    const { setTheme } = useThemeStore.getState();
    
    const hashTheme = "light#theme";
    setTheme(hashTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(hashTheme);
  });

  it("should handle theme names with exclamation marks", () => {
    const { setTheme } = useThemeStore.getState();
    
    const exclamationTheme = "light!theme";
    setTheme(exclamationTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(exclamationTheme);
  });

  it("should handle theme names with question marks", () => {
    const { setTheme } = useThemeStore.getState();
    
    const questionTheme = "light?theme";
    setTheme(questionTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(questionTheme);
  });

  it("should handle theme names with colons", () => {
    const { setTheme } = useThemeStore.getState();
    
    const colonTheme = "light:theme";
    setTheme(colonTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(colonTheme);
  });

  it("should handle theme names with semicolons", () => {
    const { setTheme } = useThemeStore.getState();
    
    const semicolonTheme = "light;theme";
    setTheme(semicolonTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(semicolonTheme);
  });

  it("should handle theme names with commas", () => {
    const { setTheme } = useThemeStore.getState();
    
    const commaTheme = "light,theme";
    setTheme(commaTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(commaTheme);
  });

  it("should handle theme names with periods", () => {
    const { setTheme } = useThemeStore.getState();
    
    const periodTheme = "light.theme";
    setTheme(periodTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(periodTheme);
  });

  it("should handle theme names with tildes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const tildeTheme = "light~theme";
    setTheme(tildeTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(tildeTheme);
  });

  it("should handle theme names with carets", () => {
    const { setTheme } = useThemeStore.getState();
    
    const caretTheme = "light^theme";
    setTheme(caretTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(caretTheme);
  });

  it("should handle theme names with percent signs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const percentTheme = "light%theme";
    setTheme(percentTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(percentTheme);
  });

  it("should handle theme names with dollar signs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const dollarTheme = "light$theme";
    setTheme(dollarTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(dollarTheme);
  });

  it("should handle theme names with at symbols", () => {
    const { setTheme } = useThemeStore.getState();
    
    const atTheme = "light@theme";
    setTheme(atTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(atTheme);
  });

  it("should handle theme names with backticks", () => {
    const { setTheme } = useThemeStore.getState();
    
    const backtickTheme = "light`theme";
    setTheme(backtickTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(backtickTheme);
  });

  it("should handle theme names with vertical bars", () => {
    const { setTheme } = useThemeStore.getState();
    
    const verticalBarTheme = "light|theme";
    setTheme(verticalBarTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(verticalBarTheme);
  });

  it("should handle theme names with backslashes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const backslashTheme = "light\\theme";
    setTheme(backslashTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(backslashTheme);
  });

  it("should handle theme names with forward slashes", () => {
    const { setTheme } = useThemeStore.getState();
    
    const forwardSlashTheme = "light/theme";
    setTheme(forwardSlashTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(forwardSlashTheme);
  });

  it("should handle theme names with spaces", () => {
    const { setTheme } = useThemeStore.getState();
    
    const spaceTheme = "light theme";
    setTheme(spaceTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(spaceTheme);
  });

  it("should handle theme names with tabs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const tabTheme = "light\ttheme";
    setTheme(tabTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(tabTheme);
  });

  it("should handle theme names with newlines", () => {
    const { setTheme } = useThemeStore.getState();
    
    const newlineTheme = "light\ntheme";
    setTheme(newlineTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(newlineTheme);
  });

  it("should handle theme names with carriage returns", () => {
    const { setTheme } = useThemeStore.getState();
    
    const carriageReturnTheme = "light\rtheme";
    setTheme(carriageReturnTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(carriageReturnTheme);
  });

  it("should handle theme names with form feeds", () => {
    const { setTheme } = useThemeStore.getState();
    
    const formFeedTheme = "light\ftheme";
    setTheme(formFeedTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(formFeedTheme);
  });

  it("should handle theme names with vertical tabs", () => {
    const { setTheme } = useThemeStore.getState();
    
    const verticalTabTheme = "light\vtheme";
    setTheme(verticalTabTheme);
    
    const { theme } = useThemeStore.getState();
    expect(theme).toBe(verticalTabTheme);
  });
});
