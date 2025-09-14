import { NotificationContainer } from "@/components/ui/Notification";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock the simple-store
const mockDispatch = vi.fn();
const mockUseNotifications = vi.fn();
const mockUseDispatch = vi.fn();

vi.mock("@/store/simple-store", () => ({
  useNotifications: () => mockUseNotifications(),
  useDispatch: () => mockDispatch,
  notificationActions: {
    remove: (id: string) => ({
      type: "NOTIFICATION/REMOVE",
      payload: id,
    }),
    clearAll: () => ({
      type: "NOTIFICATION/CLEAR_ALL",
    }),
    add: (notification: any) => ({
      type: "NOTIFICATION/ADD",
      payload: notification,
    }),
  },
}));

describe("NotificationContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without notifications", () => {
    mockUseNotifications.mockReturnValue([]);

    render(<NotificationContainer />);

    expect(screen.getByTestId("animate-presence")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render success notification", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "success",
        message: "Success message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Effacer tout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("should render error notification", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "error",
        message: "Error message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByText("Effacer tout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("should render warning notification", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "warning",
        message: "Warning message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByText("Effacer tout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("should render info notification", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "info",
        message: "Info message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByText("Effacer tout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("should render multiple notifications", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "success",
        message: "First message",
        duration: 5000,
      },
      {
        id: "2",
        type: "error",
        message: "Second message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /close/i })).toHaveLength(2);
    expect(screen.getByText("Effacer tout")).toBeInTheDocument();
  });

  it("should call removeNotification when close button is clicked", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "success",
        message: "Test message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "NOTIFICATION/REMOVE",
      payload: "1",
    });
  });

  it("should call clearAllNotifications when clear all button is clicked", () => {
    mockUseNotifications.mockReturnValue([
      {
        id: "1",
        type: "success",
        message: "Test message",
        duration: 5000,
      },
    ]);

    render(<NotificationContainer />);

    const clearAllButton = screen.getByText("Effacer tout");
    fireEvent.click(clearAllButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "NOTIFICATION/CLEAR_ALL",
    });
  });

  it("should render with correct container classes", () => {
    mockUseNotifications.mockReturnValue([]);

    render(<NotificationContainer />);

    const container = screen.getByTestId("animate-presence").parentElement;
    expect(container).toHaveClass(
      "fixed",
      "bottom-0",
      "right-0",
      "p-4",
      "space-y-4",
      "z-50"
    );
  });

  it("should render notification with correct base classes", () => {
    const mockNotifications = [
      {
        id: "1",
        type: "success" as const,
        message: "Test message",
      },
    ];

    mockUseNotifications.mockReturnValue(mockNotifications);

    render(<NotificationContainer />);

    const notification = screen
      .getByText("Test message")
      .closest("div")?.parentElement;
    expect(notification).toHaveClass(
      "rounded-lg",
      "shadow-lg",
      "p-4",
      "min-w-[300px]",
      "max-w-md"
    );
  });

  it("should render close button with correct classes", () => {
    const mockNotifications = [
      {
        id: "1",
        type: "success" as const,
        message: "Test message",
      },
    ];

    mockUseNotifications.mockReturnValue(mockNotifications);

    render(<NotificationContainer />);

    // Use getByRole with name to specifically target the close button
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toHaveClass(
      "ml-4",
      "text-white",
      "hover:text-gray-200",
      "transition-colors"
    );
  });
});
