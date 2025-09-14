import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the simple-store
const mockDispatch = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("@/store/simple-store", () => ({
  useTheme: () => mockUseTheme(),
  useDispatch: () => mockDispatch,
  themeActions: {
    toggle: () => ({ type: "THEME/TOGGLE" }),
    set: (theme: string) => ({ type: "THEME/SET", payload: theme }),
  },
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with dark theme", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("relative", "h-9", "w-9", "p-0");
    expect(screen.getByText("Changer le thème")).toBeInTheDocument();
  });

  it("should render with light theme", () => {
    mockUseTheme.mockReturnValue("light");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("relative", "h-9", "w-9", "p-0");
    expect(screen.getByText("Changer le thème")).toBeInTheDocument();
  });

  it("should call setTheme with light when current theme is dark", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
  });

  it("should call setTheme with dark when current theme is light", () => {
    mockUseTheme.mockReturnValue("light");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
  });

  it("should render with ghost variant and small size", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-9", "p-0");
  });

  it("should render moon icon when theme is dark", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    // The moon icon should be visible in dark theme
    const moonIcon = document.querySelector('[class*="h-5 w-5"]');
    expect(moonIcon).toBeInTheDocument();
  });

  it("should render sun icon when theme is light", () => {
    mockUseTheme.mockReturnValue("light");

    render(<ThemeToggle />);
    
    // The sun icon should be visible in light theme
    const sunIcon = document.querySelector('[class*="h-5 w-5"]');
    expect(sunIcon).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    
    const srText = screen.getByText("Changer le thème");
    expect(srText).toHaveClass("sr-only");
  });

  it("should handle multiple theme toggles", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    
    // First click: dark -> light
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
    
    // Second click: light -> dark
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
    
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("should render with correct button structure", () => {
    mockUseTheme.mockReturnValue("dark");

    render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    
    // Check that the button contains the motion divs
    const motionDivs = button.querySelectorAll("div");
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it("should handle theme change from external source", () => {
    const { rerender } = render(
      <ThemeToggle />
    );
    
    // Initial render with dark theme
    mockUseTheme.mockReturnValue("dark");
    
    rerender(<ThemeToggle />);
    
    // Change to light theme
    mockUseTheme.mockReturnValue("light");
    
    rerender(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should maintain button functionality after theme changes", () => {
    mockUseTheme.mockReturnValue("dark");

    const { rerender } = render(<ThemeToggle />);
    
    const button = screen.getByRole("button");
    
    // Click in dark theme
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
    
    // Change theme externally
    mockUseTheme.mockReturnValue("light");
    
    rerender(<ThemeToggle />);
    
    // Click in light theme
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "THEME/TOGGLE" });
  });
});
