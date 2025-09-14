import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  CheckCircle: ({ className, ...props }: any) => (
    <svg data-testid="check-circle" className={className} {...props}>
      CheckCircle
    </svg>
  ),
  XCircle: ({ className, ...props }: any) => (
    <svg data-testid="x-circle" className={className} {...props}>
      XCircle
    </svg>
  ),
  Eye: ({ className, ...props }: any) => (
    <svg data-testid="eye" className={className} {...props}>
      Eye
    </svg>
  ),
  EyeOff: ({ className, ...props }: any) => (
    <svg data-testid="eye-off" className={className} {...props}>
      EyeOff
    </svg>
  ),
}));

describe("PasswordStrengthIndicator", () => {
  const defaultProps = {
    password: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with empty password", () => {
    render(<PasswordStrengthIndicator {...defaultProps} />);

    expect(screen.getByText("Force du mot de passe")).toBeInTheDocument();
    expect(screen.getByText("Très faible")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should render with custom className", () => {
    render(
      <PasswordStrengthIndicator {...defaultProps} className="custom-class" />
    );

    const container = screen.getByText("Force du mot de passe").closest("div")
      ?.parentElement?.parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("should show very weak password (0%)", () => {
    render(<PasswordStrengthIndicator password="" />);

    expect(screen.getByText("Très faible")).toBeInTheDocument();
    expect(screen.getByText("Très faible")).toHaveClass("text-gray-500");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("should show very weak password (20%)", () => {
    render(<PasswordStrengthIndicator password="A" />);

    expect(screen.getByText("Très faible")).toBeInTheDocument();
    expect(screen.getByText("Très faible")).toHaveClass("text-red-500");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "20");
  });

  it("should show weak password (40%)", () => {
    render(<PasswordStrengthIndicator password="Ab" />);

    expect(screen.getByText("Faible")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toHaveClass("text-orange-500");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("should show medium password (60%)", () => {
    render(<PasswordStrengthIndicator password="Ab1" />);

    expect(screen.getByText("Moyen")).toBeInTheDocument();
    expect(screen.getByText("Moyen")).toHaveClass("text-yellow-600");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "60");
  });

  it("should show strong password (80%)", () => {
    render(<PasswordStrengthIndicator password="Ab1!" />);

    expect(screen.getByText("Fort")).toBeInTheDocument();
    expect(screen.getByText("Fort")).toHaveClass("text-blue-500");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "80");
  });

  it("should show very strong password (100%)", () => {
    render(<PasswordStrengthIndicator password="Ab1!Long" />);

    expect(screen.getByText("Très fort")).toBeInTheDocument();
    expect(screen.getByText("Très fort")).toHaveClass("text-green-500");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("should show requirements when password is not empty", () => {
    render(<PasswordStrengthIndicator password="test" />);

    expect(screen.getByText("Exigences (1/5)")).toBeInTheDocument();
    expect(screen.getByText("Au moins 8 caractères")).toBeInTheDocument();
    expect(screen.getByText("Au moins une majuscule")).toBeInTheDocument();
    expect(screen.getByText("Au moins une minuscule")).toBeInTheDocument();
    expect(screen.getByText("Au moins un chiffre")).toBeInTheDocument();
    expect(
      screen.getByText("Au moins un caractère spécial")
    ).toBeInTheDocument();
  });

  it("should not show requirements when password is empty", () => {
    render(<PasswordStrengthIndicator password="" />);

    expect(screen.queryByText("Exigences")).not.toBeInTheDocument();
    expect(screen.queryByText("Au moins 8 caractères")).not.toBeInTheDocument();
  });

  it("should show check icons for met requirements", () => {
    render(<PasswordStrengthIndicator password="Ab1!Long" />);

    const checkIcons = screen.getAllByTestId("check-circle");
    expect(checkIcons).toHaveLength(5);

    checkIcons.forEach(icon => {
      expect(icon).toHaveClass("text-green-500");
    });
  });

  it("should show x icons for unmet requirements", () => {
    render(<PasswordStrengthIndicator password="a" />);

    const xIcons = screen.getAllByTestId("x-circle");
    expect(xIcons).toHaveLength(4);

    xIcons.forEach(icon => {
      expect(icon).toHaveClass("text-red-500");
    });
  });

  it("should apply correct styling to met requirements", () => {
    render(<PasswordStrengthIndicator password="Ab1!Long" />);

    const metRequirements = screen.getAllByText(/Au moins/);
    metRequirements.forEach(req => {
      expect(req).toHaveClass("text-green-700", "line-through");
    });
  });

  it("should apply correct styling to unmet requirements", () => {
    render(<PasswordStrengthIndicator password="a" />);

    const unmetRequirements = screen.getAllByText(/Au moins/);
    unmetRequirements.forEach(req => {
      if (!req.classList.contains("line-through")) {
        expect(req).toHaveClass("text-gray-600");
      }
    });
  });

  it("should show password toggle button when onTogglePassword is provided", () => {
    const mockToggle = vi.fn();
    render(
      <PasswordStrengthIndicator
        {...defaultProps}
        onTogglePassword={mockToggle}
        showPassword={false}
      />
    );

    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText("Afficher le mot de passe")).toBeInTheDocument();
    expect(screen.getByTestId("eye")).toBeInTheDocument();
  });

  it("should show hide password text when showPassword is true", () => {
    const mockToggle = vi.fn();
    render(
      <PasswordStrengthIndicator
        {...defaultProps}
        onTogglePassword={mockToggle}
        showPassword={true}
      />
    );

    expect(screen.getByText("Masquer le mot de passe")).toBeInTheDocument();
    expect(screen.getByTestId("eye-off")).toBeInTheDocument();
  });

  it("should call onTogglePassword when toggle button is clicked", () => {
    const mockToggle = vi.fn();
    render(
      <PasswordStrengthIndicator
        {...defaultProps}
        onTogglePassword={mockToggle}
        showPassword={false}
      />
    );

    const toggleButton = screen.getByRole("button");
    fireEvent.click(toggleButton);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("should not show password toggle button when onTogglePassword is not provided", () => {
    render(<PasswordStrengthIndicator {...defaultProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Afficher le mot de passe")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Masquer le mot de passe")
    ).not.toBeInTheDocument();
  });

  it("should handle password with only lowercase letters", () => {
    render(<PasswordStrengthIndicator password="abcdefgh" />);

    expect(screen.getByText("Exigences (2/5)")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("should handle password with only uppercase letters", () => {
    render(<PasswordStrengthIndicator password="ABCDEFGH" />);

    expect(screen.getByText("Exigences (2/5)")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("should handle password with only numbers", () => {
    render(<PasswordStrengthIndicator password="12345678" />);

    expect(screen.getByText("Exigences (2/5)")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("should handle password with only special characters", () => {
    render(<PasswordStrengthIndicator password="!@#$%^&*" />);

    expect(screen.getByText("Exigences (2/5)")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
  });

  it("should handle password with mixed case and numbers", () => {
    render(<PasswordStrengthIndicator password="Abc12345" />);

    expect(screen.getByText("Exigences (4/5)")).toBeInTheDocument();
    expect(screen.getByText("Fort")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "80");
  });

  it("should handle password with all requirements met", () => {
    render(<PasswordStrengthIndicator password="Ab1!Long" />);

    expect(screen.getByText("Exigences (5/5)")).toBeInTheDocument();
    expect(screen.getByText("Très fort")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("should handle very long password", () => {
    const longPassword = `Ab1!${"a".repeat(100)}`;
    render(<PasswordStrengthIndicator password={longPassword} />);

    expect(screen.getByText("Exigences (5/5)")).toBeInTheDocument();
    expect(screen.getByText("Très fort")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("should handle password with special characters in regex", () => {
    render(<PasswordStrengthIndicator password="Ab1!@#$%^&*()" />);

    expect(screen.getByText("Exigences (5/5)")).toBeInTheDocument();
    expect(screen.getByText("Très fort")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("should update requirements when password changes", () => {
    const { rerender } = render(<PasswordStrengthIndicator password="" />);

    expect(screen.queryByText("Exigences")).not.toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="a" />);

    expect(screen.getByText("Exigences (1/5)")).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Ab1!Long" />);

    expect(screen.getByText("Exigences (5/5)")).toBeInTheDocument();
  });

  it("should have correct progress bar styling", () => {
    render(<PasswordStrengthIndicator password="Ab1!Long" />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("h-2", "rounded-full", "transition-all", "duration-300");
    expect(progressBar).toHaveStyle({ width: "100%" });
  });
});
