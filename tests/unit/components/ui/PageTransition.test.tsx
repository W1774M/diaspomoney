import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageTransition } from "@/components/ui/PageTransition";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, initial, animate, exit, variants, transition, ...props }: any) => (
      <div
        data-testid="motion-div"
        data-initial={initial}
        data-animate={animate}
        data-exit={exit}
        data-variants={JSON.stringify(variants)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

describe("PageTransition", () => {
  it("should render children", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should render with motion div wrapper", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();
  });

  it("should have correct initial animation state", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveAttribute("data-initial", "initial");
  });

  it("should have correct animate animation state", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveAttribute("data-animate", "animate");
  });

  it("should have correct exit animation state", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveAttribute("data-exit", "exit");
  });

  it("should have correct page variants", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    const variants = JSON.parse(motionDiv.getAttribute("data-variants") || "{}");
    
    expect(variants).toEqual({
      initial: {
        opacity: 0,
        x: -20,
      },
      animate: {
        opacity: 1,
        x: 0,
      },
      exit: {
        opacity: 0,
        x: 20,
      },
    });
  });

  it("should have correct transition configuration", () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const motionDiv = screen.getByTestId("motion-div");
    const transition = JSON.parse(motionDiv.getAttribute("data-transition") || "{}");
    
    expect(transition).toEqual({
      type: "tween",
      ease: "anticipate",
      duration: 0.5,
    });
  });

  it("should render multiple children", () => {
    render(
      <PageTransition>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </PageTransition>
    );
    
    expect(screen.getByText("First child")).toBeInTheDocument();
    expect(screen.getByText("Second child")).toBeInTheDocument();
    expect(screen.getByText("Third child")).toBeInTheDocument();
  });

  it("should render complex nested children", () => {
    render(
      <PageTransition>
        <header>
          <h1>Page Title</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main>
          <section>
            <h2>Section Title</h2>
            <p>Section content</p>
          </section>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      </PageTransition>
    );
    
    expect(screen.getByText("Page Title")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Section Title")).toBeInTheDocument();
    expect(screen.getByText("Section content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("should render with empty children", () => {
    render(<PageTransition></PageTransition>);
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveTextContent("");
  });

  it("should render with null children", () => {
    render(<PageTransition>{null}</PageTransition>);
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveTextContent("");
  });

  it("should render with undefined children", () => {
    render(<PageTransition>{undefined}</PageTransition>);
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveTextContent("");
  });

  it("should render with boolean children", () => {
    render(<PageTransition>{true}</PageTransition>);
    
    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();
  });

  it("should render with number children", () => {
    render(<PageTransition>{42}</PageTransition>);
    
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render with function component children", () => {
    const TestComponent = () => <div>Function component</div>;
    
    render(
      <PageTransition>
        <TestComponent />
      </PageTransition>
    );
    
    expect(screen.getByText("Function component")).toBeInTheDocument();
  });

  it("should render with array of children", () => {
    render(
      <PageTransition>
        {[
          <div key="1">First</div>,
          <div key="2">Second</div>,
          <div key="3">Third</div>,
        ]}
      </PageTransition>
    );
    
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("should maintain animation properties across renders", () => {
    const { rerender } = render(
      <PageTransition>
        <div>Initial content</div>
      </PageTransition>
    );
    
    let motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveAttribute("data-initial", "initial");
    expect(motionDiv).toHaveAttribute("data-animate", "animate");
    expect(motionDiv).toHaveAttribute("data-exit", "exit");
    
    rerender(
      <PageTransition>
        <div>Updated content</div>
      </PageTransition>
    );
    
    motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toHaveAttribute("data-initial", "initial");
    expect(motionDiv).toHaveAttribute("data-animate", "animate");
    expect(motionDiv).toHaveAttribute("data-exit", "exit");
  });

  it("should handle conditional children", () => {
    const showContent = true;
    
    render(
      <PageTransition>
        {showContent && <div>Conditional content</div>}
      </PageTransition>
    );
    
    expect(screen.getByText("Conditional content")).toBeInTheDocument();
  });

  it("should handle dynamic children", () => {
    const items = ["Item 1", "Item 2", "Item 3"];
    
    render(
      <PageTransition>
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </PageTransition>
    );
    
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });
});
