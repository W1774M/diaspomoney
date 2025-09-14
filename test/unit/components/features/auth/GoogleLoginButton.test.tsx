import { GoogleLoginButton } from "@/components/features/auth/GoogleLoginButton";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock du store simple-store
const mockDispatch = vi.fn();
vi.mock("@/store/simple-store", () => ({
  useDispatch: () => mockDispatch,
}));

// Mock de la notification
const mockAddInfo = vi.fn();
const mockAddError = vi.fn();
vi.mock("@/components/ui/Notification", () => ({
  useNotificationManager: () => ({
    addInfo: mockAddInfo,
    addError: mockAddError,
  }),
}));

describe("GoogleLoginButton", () => {
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendu", () => {
    it("should render the Google login button with correct text", () => {
      render(<GoogleLoginButton />);

      expect(screen.getByText("Continuer avec Google")).toBeInTheDocument();
    });

    it("should render the Google logo SVG", () => {
      render(<GoogleLoginButton />);

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have correct button type", () => {
      render(<GoogleLoginButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should have correct CSS classes", () => {
      render(<GoogleLoginButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full", "bg-white", "text-gray-700", "border", "border-gray-300");
    });
  });

  describe("Interaction", () => {
    it("should call onError callback when clicked", async () => {
      render(<GoogleLoginButton onError={mockOnError} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Connexion Google non disponible",
        })
      );
    });

    it("should show info notification when clicked", async () => {
      render(<GoogleLoginButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockAddInfo).toHaveBeenCalledWith("Connexion Google temporairement désactivée");
    });

    it("should work without onError callback", async () => {
      render(<GoogleLoginButton />);

      const button = screen.getByRole("button");
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe("Accessibilité", () => {
    it("should be accessible via keyboard", () => {
      render(<GoogleLoginButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should have proper button role", () => {
      render(<GoogleLoginButton />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("should accept onError prop", () => {
      render(<GoogleLoginButton onError={mockOnError} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnError).toHaveBeenCalled();
    });

    it("should not require onError prop", () => {
      render(<GoogleLoginButton />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
