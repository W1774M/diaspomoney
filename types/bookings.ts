// Bookings Types and Interfaces

export interface Booking {
  _id: string;
  userId: string;
  providerId: string;
  date: Date;
  status: string;
  paymentStatus: string;
  reservationNumber: string;
  price: number;
  totalAmount: number;
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialties: string[];
  };
  selectedService: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface BookingFilters {
  searchTerm: string;
  status: string;
  paymentStatus: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageAmount: number;
}

export interface BookingCardProps {
  booking: Booking;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

export interface BookingFormProps {
  booking?: Booking;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface BookingFormData {
  date: string;
  time: string;
  providerId: string;
  requesterId: string;
  totalAmount: number;
  notes?: string;
}

export interface BookingsHeaderProps {
  onNewBooking: () => void;
}

export interface BookingsSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface BookingsFiltersProps {
  filters: BookingFilters;
  onFilterChange: (
    key: keyof BookingFilters,
    value: string | { start: string; end: string }
  ) => void;
  availableStatuses: string[];
  availablePaymentStatuses: string[];
}

export interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

export interface BookingsPageProps {
  // Props for the main page component
}
