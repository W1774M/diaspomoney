import { BookingForm } from "@/components/features/providers/BookingForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the useForm hook
const mockRegister = vi.fn();
const mockHandleSubmit = vi.fn();
const mockWatch = vi.fn();
const mockSetValue = vi.fn();

vi.mock("@/hooks/forms", () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { errors: {} },
    watch: mockWatch,
    setValue: mockSetValue,
  }),
}));

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Button: ({ children, onClick, disabled, type, isLoading, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading && <span>Loading...</span>}
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
        <button
          type="button"
          className="country-selector"
          data-testid={`country-selector-${id}`}
        >
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

const mockProvider = {
  _id: "provider-1",
  name: "Dr. Martin",
  specialty: "Médecine générale",
  selectedServices: "Consultation, Suivi, Téléconsultation",
  availabilities: [
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "14:00", end: "14:30" },
  ],
};

const defaultProps = {
  provider: mockProvider,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
};

describe("BookingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockReturnValue({
      requester: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    });
  });

  it("renders the booking form with correct title", () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText("Prise de rendez-vous")).toBeInTheDocument();
  });

  it("shows step indicator with 3 steps", () => {
    render(<BookingForm {...defaultProps} />);

    // Check that all 3 steps are displayed
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("starts on step 1 by default", () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText("Vos informations")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Remplissez vos informations personnelles pour la prise de rendez-vous"
      )
    ).toBeInTheDocument();
  });

  it("renders step 1 form fields correctly", () => {
    render(<BookingForm {...defaultProps} />);

    // Check form fields
    expect(screen.getByLabelText(/Prénom \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone \*/)).toBeInTheDocument();
  });

  it("renders international phone input with country selector", () => {
    render(<BookingForm {...defaultProps} />);

    // Check that the PhoneInput component is rendered with country selector
    expect(screen.getByText("🇫🇷 +33")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("6 12 34 56 78")).toBeInTheDocument();
  });

  it("shows navigation buttons with correct text", () => {
    render(<BookingForm {...defaultProps} />);

    expect(screen.getByText("Annuler")).toBeInTheDocument();
    expect(screen.getByText("Suivant")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<BookingForm {...defaultProps} />);

    const cancelButton = screen.getByText("Annuler");
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("advances to step 2 when next button is clicked", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    const nextButton = screen.getByText("Suivant");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText("Informations du bénéficiaire")
      ).toBeInTheDocument();
    });
  });

  it("shows step 2 form fields when on step 2", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    const nextButton = screen.getByText("Suivant");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText("Informations du bénéficiaire")
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Prénom \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nom \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Téléphone \*/)).toBeInTheDocument();
    });
  });

  it("shows step 3 with appointment details when on step 3", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1 555 123 4567",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    // Go to step 2
    const nextButton1 = screen.getByText("Suivant");
    fireEvent.click(nextButton1);

    await waitFor(() => {
      const nextButton2 = screen.getByText("Suivant");
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      expect(screen.getByText("Détails du rendez-vous")).toBeInTheDocument();
      expect(screen.getByText("Prestataire sélectionné")).toBeInTheDocument();
      expect(screen.getByText("Dr. Martin")).toBeInTheDocument();
      expect(screen.getByText("Médecine générale")).toBeInTheDocument();
    });
  });

  it("shows timeslot selection in step 3", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1 555 123 4567",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    // Navigate to step 3
    const nextButton1 = screen.getByText("Suivant");
    fireEvent.click(nextButton1);

    await waitFor(() => {
      const nextButton2 = screen.getByText("Suivant");
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Créneau horaire \*/)).toBeInTheDocument();
      expect(screen.getByText("09:00 - 09:30")).toBeInTheDocument();
      expect(screen.getByText("10:00 - 10:30")).toBeInTheDocument();
      expect(screen.getByText("14:00 - 14:30")).toBeInTheDocument();
    });
  });

  it("shows service selection when provider has services", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1 555 123 4567",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    // Navigate to step 3
    const nextButton1 = screen.getByText("Suivant");
    fireEvent.click(nextButton1);

    await waitFor(() => {
      const nextButton2 = screen.getByText("Suivant");
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Service/)).toBeInTheDocument();
      expect(screen.getByText("Consultation")).toBeInTheDocument();
      expect(screen.getByText("Suivi")).toBeInTheDocument();
      expect(screen.getByText("Téléconsultation")).toBeInTheDocument();
    });
  });

  it("shows confirm button on final step", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1 555 123 4567",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    // Navigate to step 3
    const nextButton1 = screen.getByText("Suivant");
    fireEvent.click(nextButton1);

    await waitFor(() => {
      const nextButton2 = screen.getByText("Suivant");
      fireEvent.click(nextButton2);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirmer le rendez-vous")).toBeInTheDocument();
    });
  });

  it("allows going back to previous steps", async () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1 555 123 4567",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    // Go to step 2
    const nextButton1 = screen.getByText("Suivant");
    fireEvent.click(nextButton1);

    await waitFor(() => {
      expect(
        screen.getByText("Informations du bénéficiaire")
      ).toBeInTheDocument();
    });

    // Go back to step 1
    const prevButton = screen.getByText("Précédent");
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText("Vos informations")).toBeInTheDocument();
    });
  });

  it("disables next button when current step is not complete", () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    const nextButton = screen.getByText("Suivant");
    expect(nextButton).toBeDisabled();
  });

  it("enables next button when current step is complete", () => {
    mockWatch.mockReturnValue({
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+33 6 12 34 56 78",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    });

    render(<BookingForm {...defaultProps} />);

    const nextButton = screen.getByText("Suivant");
    expect(nextButton).not.toBeDisabled();
  });

  it("handles international phone numbers correctly", () => {
    render(<BookingForm {...defaultProps} />);

    // Check that the first phone input is rendered on step 1
    const phoneInputsStep1 = screen.getAllByTestId("phone-input");
    expect(phoneInputsStep1).toHaveLength(1); // One for requester on step 1

    // Check that the phone input has the correct structure
    const phoneInput = screen.getByTestId("phone-input");
    expect(phoneInput).toBeInTheDocument();

    // Check that the country selector is present
    const countrySelector = screen.getByTestId(
      "country-selector-requester.phone"
    );
    expect(countrySelector).toBeInTheDocument();
    expect(countrySelector).toHaveTextContent("🇫🇷 +33");

    // Check that the phone input field is present
    const phoneField = screen.getByPlaceholderText("6 12 34 56 78");
    expect(phoneField).toBeInTheDocument();
  });
});
