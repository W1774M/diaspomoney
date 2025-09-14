import Logo from "@/components/ui/Logo";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    width,
    height,
    alt,
    className,
    onError,
    priority,
    ...props
  }: any) => (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={className}
      data-priority={priority}
      onError={onError}
      {...props}
    />
  ),
}));

describe("Logo", () => {
  const defaultProps = {
    src: "/logo.png",
    width: 100,
    height: 50,
    alt: "Company Logo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(<Logo {...defaultProps} />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/logo.png");
    expect(image).toHaveAttribute("width", "100");
    expect(image).toHaveAttribute("height", "50");
    expect(image).toHaveAttribute("data-priority", "true");
  });

  it("should render with custom className", () => {
    render(<Logo {...defaultProps} className="custom-logo" />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toHaveClass("custom-logo");
  });

  it("should render fallback text when image fails to load", () => {
    render(<Logo {...defaultProps} fallbackText="Logo Text" />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toBeInTheDocument();

    // Simulate image error
    fireEvent.error(image);

    expect(screen.getByText("Logo Text")).toBeInTheDocument();
    expect(screen.queryByAltText("Company Logo")).not.toBeInTheDocument();
  });

  it("should render fallback with correct styling when image fails", () => {
    render(<Logo {...defaultProps} fallbackText="Logo Text" />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    const fallback = screen.getByText("Logo Text");
    expect(fallback).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "bg-gray-200",
      "text-gray-700",
      "font-bold"
    );
  });

  it("should render fallback with custom className when image fails", () => {
    render(
      <Logo
        {...defaultProps}
        fallbackText="Logo Text"
        className="custom-fallback"
      />
    );

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    const fallback = screen.getByText("Logo Text");
    expect(fallback).toHaveClass("custom-fallback");
  });

  it("should render fallback with correct dimensions when image fails", () => {
    render(<Logo {...defaultProps} fallbackText="Logo Text" />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    const fallback = screen.getByText("Logo Text");
    expect(fallback).toHaveStyle({ width: "100px", height: "50px" });
  });

  it("should not render fallback when image loads successfully", () => {
    render(<Logo {...defaultProps} fallbackText="Logo Text" />);

    expect(screen.getByAltText("Company Logo")).toBeInTheDocument();
    expect(screen.queryByText("Logo Text")).not.toBeInTheDocument();
  });

  it("should not render fallback when fallbackText is not provided", () => {
    render(<Logo {...defaultProps} />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    // Should still show the broken image, not a fallback
    expect(screen.getByAltText("Company Logo")).toBeInTheDocument();
  });

  it("should handle image error multiple times", () => {
    render(<Logo {...defaultProps} fallbackText="Logo Text" />);

    const image = screen.getByAltText("Company Logo");

    // First error
    fireEvent.error(image);
    expect(screen.getByText("Logo Text")).toBeInTheDocument();

    // Second error (should still show fallback)
    const fallback = screen.getByText("Logo Text");
    fireEvent.error(fallback);
    expect(screen.getByText("Logo Text")).toBeInTheDocument();
  });

  it("should render with different image sources", () => {
    const { rerender } = render(<Logo {...defaultProps} />);

    let image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("src", "/logo.png");

    rerender(<Logo {...defaultProps} src="/new-logo.png" />);

    image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("src", "/new-logo.png");
  });

  it("should render with different dimensions", () => {
    const { rerender } = render(<Logo {...defaultProps} />);

    let image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("width", "100");
    expect(image).toHaveAttribute("height", "50");

    rerender(<Logo {...defaultProps} width={200} height={100} />);

    image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("width", "200");
    expect(image).toHaveAttribute("height", "100");
  });

  it("should render with different alt text", () => {
    const { rerender } = render(<Logo {...defaultProps} />);

    let image = screen.getByAltText("Company Logo");
    expect(image).toBeInTheDocument();

    rerender(<Logo {...defaultProps} alt="New Alt Text" />);

    image = screen.getByAltText("New Alt Text");
    expect(image).toBeInTheDocument();
  });

    it("should handle empty fallback text", () => {
    render(<Logo {...defaultProps} fallbackText="" />);
    
    // Test that the component renders without crashing
    expect(screen.getByAltText("Company Logo")).toBeInTheDocument();
  });

  it("should handle whitespace-only fallback text", () => {
    render(<Logo {...defaultProps} fallbackText="   " />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    const fallback = document.querySelector(
      ".flex.items-center.justify-center.bg-gray-200"
    );
    expect(fallback).toBeInTheDocument();
  });

  it("should handle special characters in fallback text", () => {
    render(<Logo {...defaultProps} fallbackText="Logo & Brand © 2024" />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    expect(screen.getByText("Logo & Brand © 2024")).toBeInTheDocument();
  });

  it("should handle very long fallback text", () => {
    const longText = "A".repeat(100);
    render(<Logo {...defaultProps} fallbackText={longText} />);

    const image = screen.getByAltText("Company Logo");
    fireEvent.error(image);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("should maintain priority attribute", () => {
    render(<Logo {...defaultProps} />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("data-priority", "true");
  });

  it("should handle zero dimensions gracefully", () => {
    render(<Logo {...defaultProps} width={0} height={0} />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("width", "0");
    expect(image).toHaveAttribute("height", "0");
  });

  it("should handle negative dimensions gracefully", () => {
    render(<Logo {...defaultProps} width={-100} height={-50} />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("width", "-100");
    expect(image).toHaveAttribute("height", "-50");
  });

  it("should handle very large dimensions", () => {
    render(<Logo {...defaultProps} width={9999} height={9999} />);

    const image = screen.getByAltText("Company Logo");
    expect(image).toHaveAttribute("width", "9999");
    expect(image).toHaveAttribute("height", "9999");
  });
});
