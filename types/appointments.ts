// Appointments Types and Interfaces

export interface Appointment {
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

export interface AppointmentFilters {
  searchTerm: string;
  status: string;
  paymentStatus: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  averageAmount: number;
}

export interface AppointmentCardProps {
  appointment: Appointment;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

export interface AppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface AppointmentFormData {
  date: string;
  time: string;
  providerId: string;
  requesterId: string;
  totalAmount: number;
  notes?: string;
}

export interface AppointmentsHeaderProps {
  onNewAppointment: () => void;
}

export interface AppointmentsSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface AppointmentsFiltersProps {
  filters: AppointmentFilters;
  onFilterChange: (
    key: keyof AppointmentFilters,
    value: string | { start: string; end: string }
  ) => void;
  availableStatuses: string[];
  availablePaymentStatuses: string[];
}

export interface AppointmentsTableProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

export interface AppointmentsPageProps {
  // Props for the main page component
}
