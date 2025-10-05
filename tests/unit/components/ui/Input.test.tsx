import { Input } from "@/components/ui/Input";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Input", () => {
  it("should render with default props", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass(
      "flex",
      "h-10",
      "w-full",
      "rounded-md",
      "border",
      "border-input"
    );
  });

  it("should render with label", () => {
    render(<Input label="Username" placeholder="Enter username" />);

    const label = screen.getByText("Username");
    const input = screen.getByPlaceholderText("Enter username");

    expect(label).toBeInTheDocument();
    expect(label).toHaveClass(
      "block",
      "text-sm",
      "font-medium",
      "text-foreground"
    );
    expect(input).toBeInTheDocument();
  });

  it("should render with error message", () => {
    render(<Input error="This field is required" placeholder="Enter text" />);

    const errorMessage = screen.getByText("This field is required");
    const input = screen.getByPlaceholderText("Enter text");

    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("mt-1", "text-sm", "text-error");
    expect(input).toHaveClass("border-error", "focus-visible:ring-error");
  });

  it("should render without error styling when no error", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).not.toHaveClass("border-error", "focus-visible:ring-error");
  });

  it("should render with custom className", () => {
    render(<Input className="custom-input" placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("custom-input");
  });

  it("should forward all HTML input attributes", () => {
    render(
      <Input
        type="email"
        name="email"
        id="email-input"
        required
        disabled
        placeholder="Enter email"
        data-testid="email-field"
      />
    );

    const input = screen.getByPlaceholderText("Enter email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("id", "email-input");
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("disabled");
    expect(input).toHaveAttribute("data-testid", "email-field");
  });

  it("should have correct base styles", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass(
      "flex",
      "h-10",
      "w-full",
      "rounded-md",
      "border",
      "border-input",
      "bg-background",
      "px-3",
      "py-2",
      "text-sm",
      "ring-offset-background",
      "file:border-0",
      "file:bg-transparent",
      "file:text-sm",
      "file:font-medium",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
      "focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed",
      "disabled:opacity-50"
    );
  });

  it("should render label with correct styling", () => {
    render(<Input label="Password" placeholder="Enter password" />);

    const label = screen.getByText("Password");
    expect(label).toHaveClass(
      "block",
      "text-sm",
      "font-medium",
      "text-foreground",
      "mb-1"
    );
  });

  it("should render error message with correct styling", () => {
    render(<Input error="Invalid input" placeholder="Enter text" />);

    const errorMessage = screen.getByText("Invalid input");
    expect(errorMessage).toHaveClass("mt-1", "text-sm", "text-error");
  });

  it("should handle empty label gracefully", () => {
    render(<Input label="" placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("should handle empty error gracefully", () => {
    render(<Input error="" placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("should have correct display name", () => {
    expect(Input.displayName).toBe("Input");
  });

  it("should render with value", () => {
    render(<Input value="test value" onChange={() => {}} />);

    const input = screen.getByDisplayValue("test value");
    expect(input).toBeInTheDocument();
  });

  it("should render with defaultValue", () => {
    render(<Input defaultValue="default value" />);

    const input = screen.getByDisplayValue("default value");
    expect(input).toBeInTheDocument();
  });

  it("should render with placeholder", () => {
    render(<Input placeholder="Type here..." />);

    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeInTheDocument();
  });

  it("should render with different input types", () => {
    const { rerender } = render(<Input type="text" placeholder="Text input" />);
    expect(screen.getByPlaceholderText("Text input")).toHaveAttribute(
      "type",
      "text"
    );

    rerender(<Input type="password" placeholder="Password input" />);
    expect(screen.getByPlaceholderText("Password input")).toHaveAttribute(
      "type",
      "password"
    );

    rerender(<Input type="email" placeholder="Email input" />);
    expect(screen.getByPlaceholderText("Email input")).toHaveAttribute(
      "type",
      "email"
    );
  });

  it("should render with aria attributes", () => {
    render(
      <Input
        aria-label="Username input"
        aria-describedby="username-help"
        aria-required="true"
        placeholder="Enter username"
      />
    );

    const input = screen.getByPlaceholderText("Enter username");
    expect(input).toHaveAttribute("aria-label", "Username input");
    expect(input).toHaveAttribute("aria-describedby", "username-help");
    expect(input).toHaveAttribute("aria-required", "true");
  });
});
