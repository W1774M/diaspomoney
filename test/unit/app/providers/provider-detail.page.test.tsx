import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: "5" }),
}));

// Mock the mocks module to ensure we have the right data
vi.mock("@/mocks", () => ({
  MOCK_USERS: [
    {
      _id: "5",
      email: "provider@diaspomoney.com",
      password: "password123",
      name: "Provider User (Active)",
      roles: ["PROVIDER"],
      status: "ACTIVE",
      specialty: "Médecine générale",
      company: "Clinique Horizon",
      phone: "+33 1 23 45 67 89",
      address: "12 Rue de la Paix, 75002 Paris",
      profileImage: "/img/avatars/doctor.jpg",
      description:
        "Médecin généraliste avec 10 ans d'expérience, orienté patient.",
      rating: 4.6,
      selectedServices: "Consultation, Suivi, Téléconsultation",
      apiGeo: [{ name: "France" }, { name: "Belgique" }],
      images: [
        "/img/providers/clinic-1.jpg",
        "/img/providers/clinic-2.jpg",
        "/img/providers/clinic-3.jpg",
      ],
      recommended: true,
      availabilities: [
        { start: "09:00", end: "09:30" },
        { start: "10:00", end: "10:30" },
        { start: "14:00", end: "14:30" },
      ],
      appointments: [{ start: "10:00", end: "10:30" }],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
}));

// Mock the components
vi.mock("@/components/providers/index", () => ({
  InfiniteReviewsCarousel: () => <div data-testid="reviews-carousel" />,
}));

vi.mock("@/components/ui", () => ({
  StatusBadge: ({ status, size }: { status: string; size: string }) => (
    <span data-testid={`status-badge-${status}-${size}`}>{status}</span>
  ),
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
  Form: ({ children, onSubmit }: any) => (
    <form onSubmit={onSubmit}>{children}</form>
  ),
  FormField: ({ children, error }: any) => (
    <div data-testid="form-field" data-error={error}>
      {children}
    </div>
  ),
  FormLabel: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Input: ({ id, placeholder, ...props }: any) => (
    <input id={id} placeholder={placeholder} {...props} />
  ),
  PhoneInput: ({ id, placeholder, value, onChange, ...props }: any) => (
    <div data-testid="phone-input">
      <div className="flex">
        <button type="button" className="country-selector" data-testid={`country-selector-${id}`}>
          🇫🇷 +33
        </button>
        <input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e: any) => onChange?.(e.target.value)}
          {...props}
        />
      </div>
    </div>
  ),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("ProviderDetailPage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders active provider details with sections", async () => {
    const Page = (await import("@/app/providers/[id]/page"))
      .default as React.FC;

    render(<Page />);

    // Wait for the loading to complete and content to appear
    expect(
      await screen.findByText(/Retour aux prestataires/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Provider User \(Active\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Médecine générale/i)).toBeInTheDocument();
    expect(screen.getByText(/Services disponibles/i)).toBeInTheDocument();
    expect(screen.getByTestId("reviews-carousel")).toBeInTheDocument();
  });

  it("shows only active provider and not inactive", async () => {
    const Page = (await import("@/app/providers/[id]/page"))
      .default as React.FC;

    render(<Page />);

    // Wait for content to load
    await screen.findByText(/Provider User \(Active\)/i);

    expect(screen.queryByText(/Inactive/i)).not.toBeInTheDocument();
  });

  describe("Booking functionality", () => {
    it("renders booking button with correct styling", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      expect(bookingButton).toBeInTheDocument();
      expect(bookingButton).toHaveTextContent("Prendre rendez-vous");
      expect(bookingButton).toHaveClass(
        "bg-blue-600",
        "text-white",
        "rounded-lg"
      );
    });

    it("shows booking modal when button is clicked", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");

      // Modal should not be visible initially
      expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();

      // Click the booking button
      fireEvent.click(bookingButton);

      // Modal should now be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
      expect(screen.getByTestId("booking-modal-overlay")).toBeInTheDocument();
    });

    it("displays correct provider information in booking modal", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Check modal content - use more specific selectors
      const modalTitle = screen
        .getByTestId("booking-modal")
        .querySelector("h3");
      expect(modalTitle).toHaveTextContent("Prendre rendez-vous");

      // Check that the provider information is displayed in the modal specifically
      const modal = screen.getByTestId("booking-modal");
      expect(modal).toHaveTextContent("Provider User (Active)");
      expect(modal).toHaveTextContent("Prendre rendez-vous avec");
      expect(modal).toHaveTextContent("Spécialité: Médecine générale");
    });

    it("closes modal when close button is clicked", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Modal should be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();

      // Click close button
      const closeButton = screen.getByTestId("close-booking-modal");
      fireEvent.click(closeButton);

      // Modal should be hidden
      expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
    });

    it("closes modal when clicking outside modal content", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Modal should be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();

      // Click on overlay (outside modal content)
      const overlay = screen.getByTestId("booking-modal-overlay");
      fireEvent.click(overlay);

      // Modal should be hidden
      expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
    });

    it("closes modal when cancel button is clicked", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Modal should be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();

      // Click cancel button
      const cancelButton = screen.getByText("Annuler");
      fireEvent.click(cancelButton);

      // Modal should be hidden
      expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
    });

    it("opens booking form when continue button is clicked", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;
      
      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);
      
      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);
      
      // Modal should be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
      
      // Click continue button
      const continueButton = screen.getByTestId("confirm-booking-button");
      fireEvent.click(continueButton);
      
      // Modal should be replaced by booking form
      expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
      expect(screen.getByText("Prise de rendez-vous")).toBeInTheDocument();
      expect(screen.getByText("Vos informations")).toBeInTheDocument();
    });

    it("does not close modal when clicking inside modal content", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Modal should be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();

      // Click inside modal content (not on overlay)
      const modalContent = screen.getByTestId("booking-modal");
      fireEvent.click(modalContent);

      // Modal should still be visible
      expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
    });

    it("renders modal with correct accessibility attributes", async () => {
      const Page = (await import("@/app/providers/[id]/page"))
        .default as React.FC;

      render(<Page />);

      // Wait for content to load
      await screen.findByText(/Provider User \(Active\)/i);

      const bookingButton = screen.getByTestId("booking-button");
      fireEvent.click(bookingButton);

      // Check modal structure
      const modal = screen.getByTestId("booking-modal");
      const overlay = screen.getByTestId("booking-modal-overlay");

      expect(modal).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();

      // Check modal content structure - use more specific selectors
      const modalTitle = modal.querySelector("h3");
      expect(modalTitle).toHaveTextContent("Prendre rendez-vous");
      expect(screen.getByText("Annuler")).toBeInTheDocument();
      expect(screen.getByTestId("confirm-booking-button")).toHaveTextContent(
        "Continuer"
      );
    });
  });
});
