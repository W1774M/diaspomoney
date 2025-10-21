// Mock data pour dev/test conformes aux models actuels

export const MOCK_USERS = [
  {
    _id: '1',
    name: 'Dr. Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33123456789',
    roles: ['PROVIDER'],
    status: 'ACTIVE',
    emailVerified: true,
    password: '$2a$12$hashedpassword123', // Mot de passe hashé pour les tests
    specialty: 'Médecine générale',
    recommended: true,
    providerInfo: {
      type: 'INDIVIDUAL',
      category: 'HEALTH',
      specialties: ['Médecine générale', 'Urgences'],
      description: "Médecin généraliste avec 15 ans d'expérience",
      rating: 4.8,
      reviewCount: 127,
      isVerified: true,
      individual: {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('1980-07-10'),
        qualifications: [
          'Doctorat en médecine',
          'Spécialisation médecine générale',
        ],
        experience: 15,
        languages: ['Français', 'Anglais'],
      },
      professionalContact: {
        phone: '+33123456789',
        email: 'jean.dupont@example.com',
        website: 'https://drdupont.com',
      },
      professionalAddress: {
        street: '10 Rue de la Santé',
        city: 'Paris',
        postalCode: '75013',
        country: 'France',
      },
    },
    oauth: {
      google: { linked: true, providerAccountId: 'google-dupont' },
      facebook: { linked: false, providerAccountId: null },
    },
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    firstName: 'Jean',
    lastName: 'Dupont',
    dateOfBirth: new Date('1980-07-10'),
    countryOfResidence: 'France',
    targetCountry: 'Canada',
    targetCity: 'Montréal',
    selectedServices: 'Consultation médicale',
    monthlyBudget: '500-1000',
    marketingConsent: true,
    kycConsent: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    phone: '+33987654321',
    roles: ['CUSTOMER'],
    status: 'ACTIVE',
    emailVerified: true,
    password: '$2a$12$hashedpassword456', // Mot de passe hashé pour les tests
    oauth: {
      google: { linked: false, providerAccountId: null },
      facebook: { linked: true, providerAccountId: 'fb-marie' },
    },
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    firstName: 'Marie',
    lastName: 'Martin',
    dateOfBirth: new Date('1992-02-04'),
    countryOfResidence: 'France',
    targetCountry: 'Canada',
    targetCity: 'Toronto',
    selectedServices: 'Consultation médicale, Traitement',
    monthlyBudget: '300-500',
    marketingConsent: false,
    kycConsent: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    name: 'Admin Système',
    email: 'admin@diaspomoney.com',
    phone: '+33111111111',
    roles: ['ADMIN'],
    status: 'ACTIVE',
    emailVerified: true,
    password: '$2a$12$hashedpassword789', // Mot de passe hashé pour les tests
    oauth: {
      google: { linked: false, providerAccountId: null },
      facebook: { linked: false, providerAccountId: null },
    },
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    firstName: 'Admin',
    lastName: 'Système',
    marketingConsent: false,
    kycConsent: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockUsers = MOCK_USERS;

export const MOCK_SERVICES = [
  {
    _id: '1',
    name: 'Consultation générale',
    description: 'Consultation avec un médecin généraliste.',
    price: 25,
    duration: 30,
    category: 'health',
    createdAt: new Date(),
    updatedAt: new Date(),
    providerId: '1',
    active: true,
  },
  {
    _id: '2',
    name: 'Consultation spécialisée',
    description: "Consultation auprès d'un spécialiste.",
    price: 50,
    duration: 45,
    category: 'health',
    createdAt: new Date(),
    updatedAt: new Date(),
    providerId: '1',
    active: true,
  },
];

export const mockServices = MOCK_SERVICES;

export const MOCK_APPOINTMENTS = [
  {
    _id: '1',
    reservationNumber: 'RES-001',
    beneficiary: {
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+33987654321',
    },
    providerId: '1',
    serviceId: '1',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    totalAmount: 25,
    requesterId: '2',
    date: '2024-01-15',
    timeslot: '2024-01-15T10:00:00Z',
    notes: 'Consultation de routine',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    reservationNumber: 'RES-002',
    beneficiary: {
      firstName: 'Pierre',
      lastName: 'Durand',
      phone: '+33111111111',
    },
    providerId: '1',
    serviceId: '2',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount: 50,
    requesterId: '2',
    date: '2024-01-20',
    timeslot: '2024-01-20T14:00:00Z',
    notes: 'Consultation spécialisée',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockBookings = MOCK_APPOINTMENTS;

export const MOCK_INVOICES = [
  {
    _id: '1',
    invoiceNumber: 'INV-001',
    customerId: '2',
    providerId: '1',
    amount: 25,
    currency: 'EUR',
    status: 'PAID',
    dueDate: new Date('2024-02-15'),
    issueDate: new Date('2024-01-15'),
    paidDate: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        description: 'Consultation générale',
        quantity: 1,
        unitPrice: 25,
        total: 25,
      },
    ],
    notes: 'Consultation médicale',
  },
  {
    _id: '2',
    invoiceNumber: 'INV-002',
    customerId: '2',
    providerId: '1',
    amount: 50,
    currency: 'EUR',
    status: 'PENDING',
    dueDate: new Date('2024-02-20'),
    issueDate: new Date('2024-01-20'),
    paidDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        description: 'Consultation spécialisée',
        quantity: 1,
        unitPrice: 50,
        total: 50,
      },
    ],
    notes: 'Consultation spécialisée',
  },
];

export const mockInvoices = MOCK_INVOICES;

export const MOCK_PARTNERS = [
  {
    _id: '1',
    name: 'Clinique Santé Plus',
    logo: 'https://example.com/logo-clinique.png',
    description: 'Clinique spécialisée en médecine générale et urgences',
    website: 'https://clinique-sante-plus.com',
    category: 'health',
    services: ['consultation', 'treatment', 'emergency'],
    location: '10 Rue de la Santé, 75013 Paris, France',
    established: '2020',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'École Internationale',
    logo: 'https://example.com/logo-ecole.png',
    description: "École internationale pour l'éducation des enfants expatriés",
    website: 'https://ecole-internationale.com',
    category: 'education',
    services: ['primary-education', 'secondary-education', 'language-courses'],
    location: '15 Avenue des Écoles, 75005 Paris, France',
    established: '2018',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const MOCK_SPECIALITIES = [
  {
    _id: '1',
    name: 'Médecine générale',
    description: 'Médecine de premier recours pour tous types de pathologies',
    group: 'health',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'Cardiologie',
    description: 'Spécialité médicale du cœur et des vaisseaux',
    group: 'health',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    name: 'Éducation primaire',
    description: 'Enseignement pour les enfants de 6 à 11 ans',
    group: 'education',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mocks pour les tokens et autres modèles
export const MOCK_EMAIL_VERIFICATION_TOKENS = [
  {
    _id: '1',
    token: 'verification-token-123',
    userId: '2',
    email: 'marie.martin@example.com',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    createdAt: new Date(),
  },
];

export const MOCK_PASSWORD_RESET_TOKENS = [
  {
    _id: '1',
    token: 'reset-token-456',
    userId: '2',
    email: 'marie.martin@example.com',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    createdAt: new Date(),
  },
];

export const MOCK_RETRY_TOKENS = [
  {
    _id: '1',
    token: 'retry-token-789',
    userId: '2',
    action: 'email_verification',
    attempts: 1,
    maxAttempts: 3,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15min
    createdAt: new Date(),
  },
];

// Fonctions utilitaires pour les mocks
export const getProviderReviews = (_providerId: string) => [
  {
    _id: '1',
    providerId: _providerId,
    userId: '2',
    rating: 5,
    comment: 'Excellent médecin, très professionnel',
    createdAt: new Date(),
  },
  {
    _id: '2',
    providerId: _providerId,
    userId: '3',
    rating: 4,
    comment: 'Très bon service, je recommande',
    createdAt: new Date(),
  },
];

export const getProviderRatingStats = (providerId: string) => ({
  providerId,
  averageRating: 4.5,
  totalReviews: 2,
  ratingDistribution: {
    5: 1,
    4: 1,
    3: 0,
    2: 0,
    1: 0,
  },
});

// Fonction pour obtenir un utilisateur par ID
export const getMockUserById = (id: string) =>
  MOCK_USERS.find(user => user._id === id);

// Fonction pour obtenir un service par ID
export const getMockServiceById = (id: string) =>
  MOCK_SERVICES.find(service => service._id === id);

// Fonction pour obtenir un rendez-vous par ID
export const getMockAppointmentById = (id: string) =>
  MOCK_APPOINTMENTS.find(appointment => appointment._id === id);

// Fonction pour obtenir une facture par ID
export const getMockInvoiceById = (id: string) =>
  MOCK_INVOICES.find(invoice => invoice._id === id);
