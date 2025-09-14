import {
  Form,
  FormDescription,
  FormField,
  FormLabel,
} from "@/components/ui/Form";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("Form", () => {
  it("should render with default props", () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );

    const form = screen.getByRole("button").closest("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass("space-y-6");
  });

  it("should render with custom className", () => {
    const handleSubmit = vi.fn();
    render(
      <Form className="custom-form" onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );

    const form = screen.getByRole("button").closest("form");
    expect(form).toHaveClass("custom-form", "space-y-6");
  });

  it("should call onSubmit when form is submitted", () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("should prevent default form submission", () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );

    const form = screen.getByRole("button").closest("form");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        preventDefault: expect.any(Function),
        target: form,
      })
    );
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();
    const handleSubmit = vi.fn();
    render(
      <Form ref={ref} onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );

    expect(ref).toHaveBeenCalled();
  });

  it("should have correct display name", () => {
    expect(Form.displayName).toBe("Form");
  });

  it("should handle form with multiple fields", () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </Form>
    );

    const nameInput = screen.getByPlaceholderText("Name");
    const emailInput = screen.getByPlaceholderText("Email");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });
});

describe("FormField", () => {
  it("should render with default props", () => {
    render(
      <FormField>
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    const field = screen.getByPlaceholderText("Enter text").closest("div");
    expect(field).toBeInTheDocument();
    expect(field).toHaveClass("space-y-2");
  });

  it("should render with custom className", () => {
    render(
      <FormField className="custom-field">
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    const field = screen.getByPlaceholderText("Enter text").closest("div");
    expect(field).toHaveClass("custom-field", "space-y-2");
  });

  it("should render error message when error is provided", () => {
    render(
      <FormField error="This field is required">
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    const errorMessage = screen.getByText("This field is required");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("text-sm", "text-destructive");
  });

  it("should not render error message when no error", () => {
    render(
      <FormField>
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    expect(
      screen.queryByText("This field is required")
    ).not.toBeInTheDocument();
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();
    render(
      <FormField ref={ref}>
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    expect(ref).toHaveBeenCalled();
  });

  it("should have correct display name", () => {
    expect(FormField.displayName).toBe("FormField");
  });

  it("should handle empty error gracefully", () => {
    render(
      <FormField error="">
        <input type="text" placeholder="Enter text" />
      </FormField>
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });
});

describe("FormLabel", () => {
  it("should render with default props", () => {
    render(<FormLabel>Username</FormLabel>);

    const label = screen.getByText("Username");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass(
      "text-sm",
      "font-medium",
      "leading-none",
      "peer-disabled:cursor-not-allowed",
      "peer-disabled:opacity-70"
    );
  });

  it("should render with custom className", () => {
    render(<FormLabel className="custom-label">Username</FormLabel>);

    const label = screen.getByText("Username");
    expect(label).toHaveClass("custom-label");
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();
    render(<FormLabel ref={ref}>Username</FormLabel>);

    expect(ref).toHaveBeenCalled();
  });

  it("should have correct display name", () => {
    expect(FormLabel.displayName).toBe("FormLabel");
  });

  it("should handle htmlFor attribute", () => {
    render(<FormLabel htmlFor="username-input">Username</FormLabel>);

    const label = screen.getByText("Username");
    expect(label).toHaveAttribute("for", "username-input");
  });

  it("should handle aria attributes", () => {
    render(
      <FormLabel aria-describedby="username-help" aria-required="true">
        Username
      </FormLabel>
    );

    const label = screen.getByText("Username");
    expect(label).toHaveAttribute("aria-describedby", "username-help");
    expect(label).toHaveAttribute("aria-required", "true");
  });
});

describe("FormDescription", () => {
  it("should render with default props", () => {
    render(<FormDescription>Enter your username to continue</FormDescription>);

    const description = screen.getByText("Enter your username to continue");
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("should render with custom className", () => {
    render(
      <FormDescription className="custom-description">
        Enter your username to continue
      </FormDescription>
    );

    const description = screen.getByText("Enter your username to continue");
    expect(description).toHaveClass("custom-description");
  });

  it("should forward ref correctly", () => {
    const ref = vi.fn();
    render(<FormDescription ref={ref}>Description text</FormDescription>);

    expect(ref).toHaveBeenCalled();
  });

  it("should have correct display name", () => {
    expect(FormDescription.displayName).toBe("FormDescription");
  });

  it("should handle aria attributes", () => {
    render(
      <FormDescription aria-describedby="help-text" role="note">
        Help text here
      </FormDescription>
    );

    const description = screen.getByText("Help text here");
    expect(description).toHaveAttribute("aria-describedby", "help-text");
    expect(description).toHaveAttribute("role", "note");
  });
});

describe("Form Integration", () => {
  it("should work together as a complete form", () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <FormField error="Username is required">
          <FormLabel htmlFor="username">Username</FormLabel>
          <input id="username" type="text" placeholder="Enter username" />
          <FormDescription>Enter your unique username</FormDescription>
        </FormField>
        <button type="submit">Submit</button>
      </Form>
    );

    const form = screen.getByRole("button").closest("form");
    const label = screen.getByText("Username");
    const input = screen.getByPlaceholderText("Enter username");
    const description = screen.getByText("Enter your unique username");
    const error = screen.getByText("Username is required");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    expect(form).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(error).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    // Test form submission
    fireEvent.click(submitButton);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
