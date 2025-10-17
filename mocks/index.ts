// Mock data for development and testing
export const MOCK_USERS = [
  {
    id: '1',
    name: 'Dr. Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33123456789',
    specialty: 'Médecine générale',
    role: 'PROVIDER',
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    phone: '+33987654321',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  },
];

export const mockUsers = MOCK_USERS;

export const MOCK_SERVICES = [
  {
    id: '1',
    name: 'Consultation générale',
    price: 25,
    duration: 30,
    category: 'health',
  },
  {
    id: '2',
    name: 'Consultation spécialisée',
    price: 50,
    duration: 45,
    category: 'health',
  },
];

export const mockServices = MOCK_SERVICES;

export const MOCK_APPOINTMENTS = [
  {
    id: '1',
    providerId: '1',
    serviceId: '1',
    date: new Date(),
    status: 'CONFIRMED',
    reservationNumber: 'RES-001',
    recipient: {
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+33123456789',
    },
    provider: {
      id: '1',
      name: 'Dr. Jean Dupont',
      specialty: 'Médecine générale',
    },
    selectedService: {
      id: '1',
      name: 'Consultation générale',
      price: 25,
      duration: 30,
    },
    timeslot: '2024-01-15T10:00:00Z',
    paymentStatus: 'PAID',
    totalAmount: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    requester: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+33123456789',
    },
  },
];

export const mockBookings = MOCK_APPOINTMENTS;

export const MOCK_INVOICES = [
  {
    id: '1',
    userId: '2',
    amount: 25,
    currency: 'EUR',
    status: 'PAID',
    dueDate: new Date(),
    createdAt: new Date(),
    invoiceNumber: 'INV-001',
    customerId: '2',
    providerId: '1',
    issueDate: new Date(),
    paidDate: new Date(),
    items: [
      {
        description: 'Consultation générale',
        quantity: 1,
        price: 25,
      },
    ],
    notes: 'Consultation médicale',
  },
];

export const mockInvoices = MOCK_INVOICES;

export const MOCK_PARTNERS = [
  {
    id: '1',
    name: 'Partner One',
    type: 'INSTITUTION',
    status: 'ACTIVE',
    logo: 'https://example.com/logo.png',
    description: 'Partner description',
    website: 'https://partner.com',
    category: 'health',
    services: ['consultation', 'treatment'],
    location: 'Paris, France',
    established: '2020',
  },
];

export const MOCK_SPECIALITIES = [
  {
    id: '1',
    specialityId: 1,
    name: 'Médecine générale',
    category: 'health',
  },
];

export const getProviderReviews = (_providerId: string) => [];
export const getProviderRatingStats = () => ({});
