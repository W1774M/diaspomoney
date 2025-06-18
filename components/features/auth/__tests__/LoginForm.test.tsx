import { useAuthStore } from "@/store/auth";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "../LoginForm";

type MockUseAuthStore = {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
};

// Mock du store d'authentification
vi.mock("@/store/auth", () => ({
  useAuthStore: vi.fn(),
}));

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  const mockLogin = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      setError: mockSetError,
    } as MockUseAuthStore);
  });

  it("renders login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByText("Connexion")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors for invalid inputs", async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
    expect(
      await screen.findByText(
        /le mot de passe doit contenir au moins 6 caractères/i
      )
    ).toBeInTheDocument();
  });

  it("calls login function with form data on valid submission", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole("button", { name: /se connecter/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("displays error message from auth store", () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: "Identifiants invalides",
      setError: mockSetError,
    } as MockUseAuthStore);

    render(<LoginForm />);
    expect(screen.getByText("Identifiants invalides")).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      setError: mockSetError,
    } as MockUseAuthStore);

    render(<LoginForm />);
    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    expect(submitButton).toBeDisabled();
  });
});
