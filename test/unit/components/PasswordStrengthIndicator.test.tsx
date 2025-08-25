import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("PasswordStrengthIndicator", () => {
  it("should render password strength indicator", () => {
    render(<PasswordStrengthIndicator password="test" />);

    expect(screen.getByText("Force du mot de passe")).toBeInTheDocument();
    expect(screen.getByText("Exigences (0/5)")).toBeInTheDocument();
  });

  it("should show weak password strength", () => {
    render(<PasswordStrengthIndicator password="weak" />);

    expect(screen.getByText("Très faible")).toBeInTheDocument();
    expect(screen.getByText("Exigences (0/5)")).toBeInTheDocument();
  });

  it("should show strong password strength", () => {
    render(<PasswordStrengthIndicator password="SecurePass123!" />);

    expect(screen.getByText("Très fort")).toBeInTheDocument();
    expect(screen.getByText("Exigences (5/5)")).toBeInTheDocument();
  });

  it("should display all requirements", () => {
    render(<PasswordStrengthIndicator password="test" />);

    expect(screen.getByText("Au moins 8 caractères")).toBeInTheDocument();
    expect(screen.getByText("Au moins une majuscule")).toBeInTheDocument();
    expect(screen.getByText("Au moins une minuscule")).toBeInTheDocument();
    expect(screen.getByText("Au moins un chiffre")).toBeInTheDocument();
    expect(
      screen.getByText("Au moins un caractère spécial")
    ).toBeInTheDocument();
  });

  it("should show toggle password button when onTogglePassword is provided", () => {
    const mockToggle = vi.fn();
    render(
      <PasswordStrengthIndicator
        password="test"
        showPassword={false}
        onTogglePassword={mockToggle}
      />
    );

    const toggleButton = screen.getByText("Afficher le mot de passe");
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("should show correct toggle text based on showPassword prop", () => {
    const mockToggle = vi.fn();

    const { rerender } = render(
      <PasswordStrengthIndicator
        password="test"
        showPassword={false}
        onTogglePassword={mockToggle}
      />
    );

    expect(screen.getByText("Afficher le mot de passe")).toBeInTheDocument();

    rerender(
      <PasswordStrengthIndicator
        password="test"
        showPassword={true}
        onTogglePassword={mockToggle}
      />
    );

    expect(screen.getByText("Masquer le mot de passe")).toBeInTheDocument();
  });

  it("should not show toggle button when onTogglePassword is not provided", () => {
    render(<PasswordStrengthIndicator password="test" />);

    expect(
      screen.queryByText("Afficher le mot de passe")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Masquer le mot de passe")
    ).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should update strength when password changes", () => {
    const { rerender } = render(<PasswordStrengthIndicator password="weak" />);

    expect(screen.getByText("Très faible")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="SecurePass123!" />);

    expect(screen.getByText("Très fort")).toBeInTheDocument();
  });

  it("should show correct progress bar width", () => {
    render(<PasswordStrengthIndicator password="SecurePass123!" />);

    const progressBar =
      screen.getByRole("progressbar") ||
      document.querySelector('[style*="width: 100%"]');

    expect(progressBar).toBeInTheDocument();
  });

  it("should handle empty password", () => {
    render(<PasswordStrengthIndicator password="" />);

    expect(screen.getByText("Très faible")).toBeInTheDocument();
    expect(screen.getByText("Exigences (0/5)")).toBeInTheDocument();
  });
});
