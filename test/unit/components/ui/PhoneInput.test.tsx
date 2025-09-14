import { PhoneInput } from "@/components/ui/PhoneInput";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock the cn utility function
vi.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("PhoneInput", () => {
  const defaultProps = {
    onChange: vi.fn(),
  };

  it("renders with default country (France)", () => {
    render(<PhoneInput {...defaultProps} />);

    // Check for the country selector button
    const countryButton = screen.getByRole("button");
    expect(countryButton).toBeInTheDocument();
    expect(countryButton).toHaveTextContent("🇫🇷");
    expect(countryButton).toHaveTextContent("+33");

    expect(screen.getByPlaceholderText("6 12 34 56 78")).toBeInTheDocument();
  });

  it("renders with label when provided", () => {
    render(<PhoneInput {...defaultProps} label="Téléphone" />);

    expect(screen.getByText("Téléphone")).toBeInTheDocument();
  });

  it("opens country dropdown when country selector is clicked", async () => {
    render(<PhoneInput {...defaultProps} />);

    const countryButton = screen.getByRole("button");
    fireEvent.click(countryButton);

    await waitFor(() => {
      // Check for specific countries in the dropdown
      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(screen.getByText("Canada/USA")).toBeInTheDocument();
    });
  });

  it("calls onChange when phone number changes", () => {
    render(<PhoneInput {...defaultProps} />);

    const phoneInput = screen.getByPlaceholderText("6 12 34 56 78");
    fireEvent.change(phoneInput, { target: { value: "6 12 34 56 78" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith("+33 6 12 34 56 78");
  });

  it("displays error message when error prop is provided", () => {
    render(<PhoneInput {...defaultProps} error="Numéro invalide" />);

    expect(screen.getByText("Numéro invalide")).toBeInTheDocument();
  });

  it("applies error styling when error is present", () => {
    render(<PhoneInput {...defaultProps} error="Numéro invalide" />);

    const phoneInput = screen.getByPlaceholderText("6 12 34 56 78");
    expect(phoneInput).toHaveClass("border-error");
  });

  it("handles initial value with country code", () => {
    render(<PhoneInput {...defaultProps} value="+33 6 12 34 56 78" />);

    const phoneInput = screen.getByPlaceholderText("6 12 34 56 78");
    expect(phoneInput).toHaveValue("6 12 34 56 78");
  });

  it("handles empty value", () => {
    render(<PhoneInput {...defaultProps} value="" />);

    const phoneInput = screen.getByPlaceholderText("6 12 34 56 78");
    expect(phoneInput).toHaveValue("");
  });

  it("renders all supported countries in dropdown", async () => {
    render(<PhoneInput {...defaultProps} />);

    const countryButton = screen.getByRole("button");
    fireEvent.click(countryButton);

    await waitFor(() => {
      // Check for several countries using more specific selectors
      expect(screen.getByText("Canada/USA")).toBeInTheDocument(); // USA
      expect(screen.getByText("Royaume-Uni")).toBeInTheDocument(); // UK
      expect(screen.getByText("Côte d'Ivoire")).toBeInTheDocument(); // Côte d'Ivoire
      expect(screen.getByText("Sénégal")).toBeInTheDocument(); // Sénégal
      expect(screen.getByText("Cameroun")).toBeInTheDocument(); // Cameroun
    });
  });
});
