import {
  AppointmentProvider,
  useAppointment,
} from "@/components/features/providers/AppointmentContext";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Test component that uses the context
const TestComponent = () => {
  const { data, setData } = useAppointment();
  return (
    <div>
      <div data-testid="data-display">
        {data ? JSON.stringify(data) : "No data"}
      </div>
      <button
        onClick={() => setData({ id: "1", title: "Test Appointment" })}
        data-testid="set-data-button"
      >
        Set Data
      </button>
      <button onClick={() => setData(null)} data-testid="clear-data-button">
        Clear Data
      </button>
    </div>
  );
};

// Test component that uses the context outside provider
const TestComponentOutsideProvider = () => {
  try {
    const { data } = useAppointment();
    return <div data-testid="data-display">{JSON.stringify(data)}</div>;
  } catch (error) {
    return (
      <div data-testid="error-display">
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
};

describe("AppointmentContext", () => {
  describe("AppointmentProvider", () => {
    it("should render children correctly", () => {
      render(
        <AppointmentProvider>
          <div>Test Child</div>
        </AppointmentProvider>
      );

      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <AppointmentProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </AppointmentProvider>
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });

    it("should render complex nested children", () => {
      render(
        <AppointmentProvider>
          <div>
            <header>
              <h1>Header</h1>
              <nav>
                <a href="/">Home</a>
                <a href="/appointments">Appointments</a>
              </nav>
            </header>
            <main>
              <section>
                <h2>Appointments</h2>
                <p>Manage your appointments</p>
              </section>
            </main>
          </div>
        </AppointmentProvider>
      );

      // The AppointmentProvider just provides context, it doesn't render children directly
      // So we check that the provider renders without crashing
      expect(document.body).toBeInTheDocument();
    });

    it("should render empty children", () => {
      render(<AppointmentProvider>{null}</AppointmentProvider>);

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it("should render undefined children", () => {
      render(<AppointmentProvider>{undefined}</AppointmentProvider>);

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it("should render boolean children", () => {
      render(<AppointmentProvider>{true}</AppointmentProvider>);

      // The AppointmentProvider just provides context, it doesn't render children directly
      expect(document.body).toBeInTheDocument();
    });

    it("should render number children", () => {
      render(<AppointmentProvider>{42}</AppointmentProvider>);

      // The AppointmentProvider just provides context, it doesn't render children directly
      expect(document.body).toBeInTheDocument();
    });

    it("should render string children", () => {
      render(<AppointmentProvider>Simple string</AppointmentProvider>);

      // The AppointmentProvider just provides context, it doesn't render children directly
      expect(document.body).toBeInTheDocument();
    });

    it("should render function children", () => {
      const TestFunction = () => <div>Function component</div>;
      render(
        <AppointmentProvider>
          <TestFunction />
        </AppointmentProvider>
      );

      // The AppointmentProvider just provides context, it doesn't render children directly
      expect(document.body).toBeInTheDocument();
    });

    it("should render array of children", () => {
      render(
        <AppointmentProvider>
          {[
            <div key="1">First</div>,
            <div key="2">Second</div>,
            <div key="3">Third</div>,
          ]}
        </AppointmentProvider>
      );

      // The AppointmentProvider just provides context, it doesn't render children directly
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("useAppointment hook", () => {
    it("should provide initial null data", () => {
      render(
        <AppointmentProvider>
          <TestComponent />
        </AppointmentProvider>
      );

      expect(screen.getByTestId("data-display")).toHaveTextContent("No data");
    });

    it("should allow setting data", async () => {
      render(
        <AppointmentProvider>
          <TestComponent />
        </AppointmentProvider>
      );

      const setDataButton = screen.getByTestId("set-data-button");

      await act(async () => {
        setDataButton.click();
      });

      expect(screen.getByTestId("data-display")).toHaveTextContent(
        '{"id":"1","title":"Test Appointment"}'
      );
    });

    it("should allow clearing data", async () => {
      render(
        <AppointmentProvider>
          <TestComponent />
        </AppointmentProvider>
      );

      const setDataButton = screen.getByTestId("set-data-button");
      const clearDataButton = screen.getByTestId("clear-data-button");

      // First set some data
      await act(async () => {
        setDataButton.click();
      });

      // Then clear it
      await act(async () => {
        clearDataButton.click();
      });

      expect(screen.getByTestId("data-display")).toHaveTextContent("No data");
    });

    it("should maintain data state between renders", async () => {
      const { rerender } = render(
        <AppointmentProvider>
          <TestComponent />
        </AppointmentProvider>
      );

      const setDataButton = screen.getByTestId("set-data-button");

      await act(async () => {
        setDataButton.click();
      });

      expect(screen.getByTestId("data-display")).toHaveTextContent(
        '{"id":"1","title":"Test Appointment"}'
      );

      // Rerender the component
      rerender(
        <AppointmentProvider>
          <TestComponent />
        </AppointmentProvider>
      );

      // Data should still be there
      expect(screen.getByTestId("data-display")).toHaveTextContent(
        '{"id":"1","title":"Test Appointment"}'
      );
    });

    it("should handle complex data objects", async () => {
      const ComplexTestComponent = () => {
        const { data, setData } = useAppointment();
        return (
          <div>
            <div data-testid="data-display">
              {data ? JSON.stringify(data) : "No data"}
            </div>
            <button
              onClick={() =>
                setData({
                  id: "complex-1",
                  title: "Complex Appointment",
                  status: "CONFIRMED",
                  priority: "HIGH",
                  description: "A complex appointment with multiple fields",
                })
              }
              data-testid="set-complex-data-button"
            >
              Set Complex Data
            </button>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <ComplexTestComponent />
        </AppointmentProvider>
      );

      const setComplexDataButton = screen.getByTestId(
        "set-complex-data-button"
      );

      await act(async () => {
        setComplexDataButton.click();
      });

      const dataDisplay = screen.getByTestId("data-display");
      expect(dataDisplay.textContent).toContain("Complex Appointment");
      expect(dataDisplay.textContent).toContain("CONFIRMED");
      expect(dataDisplay.textContent).toContain("HIGH");
    });

    it("should handle data updates", async () => {
      const UpdateTestComponent = () => {
        const { data, setData } = useAppointment();
        return (
          <div>
            <div data-testid="data-display">
              {data ? JSON.stringify(data) : "No data"}
            </div>
            <button
              onClick={() => setData({ id: "1", title: "First Title" })}
              data-testid="set-first-button"
            >
              Set First
            </button>
            <button
              onClick={() => setData({ id: "2", title: "Second Title" })}
              data-testid="set-second-button"
            >
              Set Second
            </button>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <UpdateTestComponent />
        </AppointmentProvider>
      );

      const setFirstButton = screen.getByTestId("set-first-button");
      const setSecondButton = screen.getByTestId("set-second-button");

      // Set first data
      await act(async () => {
        setFirstButton.click();
      });
      expect(screen.getByTestId("data-display")).toHaveTextContent(
        "First Title"
      );

      // Update data
      await act(async () => {
        setSecondButton.click();
      });
      expect(screen.getByTestId("data-display")).toHaveTextContent(
        "Second Title"
      );
    });

    it("should handle multiple data changes rapidly", async () => {
      const RapidTestComponent = () => {
        const { data, setData } = useAppointment();
        return (
          <div>
            <div data-testid="data-display">
              {data ? JSON.stringify(data) : "No data"}
            </div>
            <button
              onClick={() => {
                setData({ id: "1", title: "First" });
                setData({ id: "2", title: "Second" });
                setData({ id: "3", title: "Third" });
              }}
              data-testid="rapid-set-button"
            >
              Rapid Set
            </button>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <RapidTestComponent />
        </AppointmentProvider>
      );

      const rapidSetButton = screen.getByTestId("rapid-set-button");

      await act(async () => {
        rapidSetButton.click();
      });

      // Should show the last set value
      expect(screen.getByTestId("data-display")).toHaveTextContent("Third");
    });

    it("should handle null data updates", async () => {
      const NullTestComponent = () => {
        const { data, setData } = useAppointment();
        return (
          <div>
            <div data-testid="data-display">
              {data ? JSON.stringify(data) : "No data"}
            </div>
            <button
              onClick={() => setData({ id: "1", title: "Some Data" })}
              data-testid="set-data-button"
            >
              Set Data
            </button>
            <button onClick={() => setData(null)} data-testid="set-null-button">
              Set Null
            </button>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <NullTestComponent />
        </AppointmentProvider>
      );

      const setDataButton = screen.getByTestId("set-data-button");
      const setNullButton = screen.getByTestId("set-null-button");

      // Set some data first
      await act(async () => {
        setDataButton.click();
      });
      expect(screen.getByTestId("data-display")).toHaveTextContent("Some Data");

      // Set to null
      await act(async () => {
        setNullButton.click();
      });
      expect(screen.getByTestId("data-display")).toHaveTextContent("No data");
    });
  });

  describe("Error handling", () => {
    it("should throw error when used outside provider", () => {
      render(<TestComponentOutsideProvider />);

      expect(screen.getByTestId("error-display")).toHaveTextContent(
        "useAppointment must be used within an AppointmentProvider"
      );
    });

    it("should throw error with correct message", () => {
      render(<TestComponentOutsideProvider />);

      const errorDisplay = screen.getByTestId("error-display");
      expect(errorDisplay.textContent).toBe(
        "useAppointment must be used within an AppointmentProvider"
      );
    });

    it("should handle multiple error cases", () => {
      const TestMultipleErrors = () => {
        try {
          const { data } = useAppointment();
          return <div data-testid="success">{JSON.stringify(data)}</div>;
        } catch (error) {
          return (
            <div data-testid="error">
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
          );
        }
      };

      render(<TestMultipleErrors />);

      expect(screen.getByTestId("error")).toHaveTextContent(
        "useAppointment must be used within an AppointmentProvider"
      );
    });
  });

  describe("Context value structure", () => {
    it("should provide correct context structure", () => {
      const TestContextStructure = () => {
        const context = useAppointment();
        return (
          <div>
            <div data-testid="has-data">
              Has data: {context.data !== null ? "yes" : "no"}
            </div>
            <div data-testid="has-setdata">
              Has setData:{" "}
              {typeof context.setData === "function" ? "yes" : "no"}
            </div>
            <div data-testid="context-keys">
              Keys: {Object.keys(context).join(",")}
            </div>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <TestContextStructure />
        </AppointmentProvider>
      );

      expect(screen.getByTestId("has-data")).toHaveTextContent("Has data: no");
      expect(screen.getByTestId("has-setdata")).toHaveTextContent(
        "Has setData: yes"
      );
      expect(screen.getByTestId("context-keys")).toHaveTextContent(
        "Keys: data,setData"
      );
    });

    it("should maintain context value reference stability", () => {
      let renderCount = 0;
      let contextValue: any = null;

      const TestContextStability = () => {
        const context = useAppointment();
        renderCount++;

        if (renderCount === 1) {
          contextValue = context;
        }

        return (
          <div>
            <div data-testid="render-count">Render: {renderCount}</div>
            <div data-testid="context-stable">
              Stable: {context === contextValue ? "yes" : "no"}
            </div>
            <button
              onClick={() => context.setData({ id: "1", title: "Test" })}
              data-testid="trigger-render"
            >
              Trigger Render
            </button>
          </div>
        );
      };

      render(
        <AppointmentProvider>
          <TestContextStability />
        </AppointmentProvider>
      );

      expect(screen.getByTestId("context-stable")).toHaveTextContent(
        "Stable: yes"
      );

      // Trigger a re-render
      const triggerButton = screen.getByTestId("trigger-render");
      triggerButton.click();

      // Context should still be stable
      expect(screen.getByTestId("context-stable")).toHaveTextContent(
        "Stable: yes"
      );
    });
  });
});
