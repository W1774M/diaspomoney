import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("should render with default props", () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary", "text-white", "h-10", "px-4");
  });

  it("should render with custom className", () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("should render primary variant by default", () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary", "text-white", "hover:bg-primary-dark");
  });

  it("should render secondary variant", () => {
    render(<Button variant="secondary">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary", "text-white", "hover:bg-secondary-dark");
  });

  it("should render outline variant", () => {
    render(<Button variant="outline">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-2", "border-primary", "text-primary");
  });

  it("should render ghost variant", () => {
    render(<Button variant="ghost">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-muted", "text-foreground");
  });

  it("should render small size", () => {
    render(<Button size="sm">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-8", "px-3", "text-sm");
  });

  it("should render medium size by default", () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "px-4");
  });

  it("should render large size", () => {
    render(<Button size="lg">Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-12", "px-6", "text-lg");
  });

  it("should show loading spinner when isLoading is true", () => {
    render(<Button isLoading>Click me</Button>);
    
    const button = screen.getByRole("button");
    const spinner = button.querySelector("svg");
    
    expect(button).toBeDisabled();
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin", "h-4", "w-4");
  });

  it("should be disabled when isLoading is true", () => {
    render(<Button isLoading>Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Click me</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it("should have correct base styles", () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-md",
      "font-medium",
      "transition-colors",
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "disabled:pointer-events-none",
      "disabled:opacity-50"
    );
  });

  it("should handle all props correctly", () => {
    const handleClick = vi.fn();
    render(
      <Button
        type="submit"
        form="test-form"
        name="test-button"
        value="test-value"
        onClick={handleClick}
        data-testid="test-button"
      >
        Click me
      </Button>
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("form", "test-form");
    expect(button).toHaveAttribute("name", "test-button");
    expect(button).toHaveAttribute("value", "test-value");
    expect(button).toHaveAttribute("data-testid", "test-button");
  });

  it("should display children correctly", () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("should have correct display name", () => {
    expect(Button.displayName).toBe("Button");
  });
});
