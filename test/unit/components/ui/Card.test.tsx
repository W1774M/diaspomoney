import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

describe("Card Components", () => {
  describe("Card", () => {
    it("should render with default props", () => {
      render(<Card>Card content</Card>);
      
      const card = screen.getByText("Card content");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("rounded-lg", "border", "bg-card", "text-card-foreground", "shadow-sm");
    });

    it("should render with custom className", () => {
      render(<Card className="custom-card">Card content</Card>);
      
      const card = screen.getByText("Card content");
      expect(card).toHaveClass("custom-card");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<Card ref={ref}>Card content</Card>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should forward additional props", () => {
      render(<Card data-testid="card" aria-label="Test card">Card content</Card>);
      
      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("aria-label", "Test card");
    });
  });

  describe("CardHeader", () => {
    it("should render with default props", () => {
      render(<CardHeader>Header content</CardHeader>);
      
      const header = screen.getByText("Header content");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
    });

    it("should render with custom className", () => {
      render(<CardHeader className="custom-header">Header content</CardHeader>);
      
      const header = screen.getByText("Header content");
      expect(header).toHaveClass("custom-header");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<CardHeader ref={ref}>Header content</CardHeader>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardTitle", () => {
    it("should render with default props", () => {
      render(<CardTitle>Card Title</CardTitle>);
      
      const title = screen.getByText("Card Title");
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe("H3");
      expect(title).toHaveClass("text-2xl", "font-semibold", "leading-none", "tracking-tight");
    });

    it("should render with custom className", () => {
      render(<CardTitle className="custom-title">Card Title</CardTitle>);
      
      const title = screen.getByText("Card Title");
      expect(title).toHaveClass("custom-title");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<CardTitle ref={ref}>Card Title</CardTitle>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it("should forward additional props", () => {
      render(<CardTitle data-testid="title" aria-label="Test title">Card Title</CardTitle>);
      
      const title = screen.getByTestId("title");
      expect(title).toHaveAttribute("aria-label", "Test title");
    });
  });

  describe("CardDescription", () => {
    it("should render with default props", () => {
      render(<CardDescription>Card description</CardDescription>);
      
      const description = screen.getByText("Card description");
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe("P");
      expect(description).toHaveClass("text-sm", "text-muted-foreground");
    });

    it("should render with custom className", () => {
      render(<CardDescription className="custom-description">Card description</CardDescription>);
      
      const description = screen.getByText("Card description");
      expect(description).toHaveClass("custom-description");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<CardDescription ref={ref}>Card description</CardDescription>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe("CardContent", () => {
    it("should render with default props", () => {
      render(<CardContent>Content text</CardContent>);
      
      const content = screen.getByText("Content text");
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass("p-6", "pt-0");
    });

    it("should render with custom className", () => {
      render(<CardContent className="custom-content">Content text</CardContent>);
      
      const content = screen.getByText("Content text");
      expect(content).toHaveClass("custom-content");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<CardContent ref={ref}>Content text</CardContent>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardFooter", () => {
    it("should render with default props", () => {
      render(<CardFooter>Footer content</CardFooter>);
      
      const footer = screen.getByText("Footer content");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
    });

    it("should render with custom className", () => {
      render(<CardFooter className="custom-footer">Footer content</CardFooter>);
      
      const footer = screen.getByText("Footer content");
      expect(footer).toHaveClass("custom-footer");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<CardFooter ref={ref}>Footer content</CardFooter>);
      
      expect(ref.current).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Card Composition", () => {
    it("should render complete card structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Main content here")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should apply custom classes to all components", () => {
      render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
            <CardDescription className="custom-desc">Description</CardDescription>
          </CardHeader>
          <CardContent className="custom-content">
            <p>Content</p>
          </CardContent>
          <CardFooter className="custom-footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      const card = screen.getByText("Title").closest("div")?.parentElement;
      const header = screen.getByText("Title").closest("div");
      const title = screen.getByText("Title");
      const description = screen.getByText("Description");
      const content = screen.getByText("Content").closest("div");
      const footer = screen.getByText("Action").closest("div");
      
      expect(card).toHaveClass("custom-card");
      expect(header).toHaveClass("custom-header");
      expect(title).toHaveClass("custom-title");
      expect(description).toHaveClass("custom-desc");
      expect(content).toHaveClass("custom-content");
      expect(footer).toHaveClass("custom-footer");
    });
  });
});
