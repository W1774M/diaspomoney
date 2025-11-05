// Mock data pour dev/test conformes aux models actuels

export const MOCK_USERS = [
  {
    _id: '1',
    name: 'Dr. Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33123456789',
    company: 'Cabinet Médical Dupont',
    address: '10 Rue de la Santé, 75013 Paris, France',
    roles: ['PROVIDER'],
    status: 'ACTIVE',
    emailVerified: true,
    isEmailVerified: true,
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
        coordinates: {
          latitude: 48.8316,
          longitude: 2.3572,
        },
      },
      availability: {
        monday: [
          {
            start: '09:00',
            end: '12:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 2,
          },
          {
            start: '14:00',
            end: '18:00',
            isAvailable: true,
            maxBookings: 8,
            currentBookings: 3,
          },
        ],
        tuesday: [
          {
            start: '09:00',
            end: '12:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 4,
          },
          {
            start: '14:00',
            end: '18:00',
            isAvailable: true,
            maxBookings: 8,
            currentBookings: 5,
          },
        ],
        wednesday: [
          {
            start: '09:00',
            end: '12:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 1,
          },
        ],
        thursday: [
          {
            start: '09:00',
            end: '12:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 3,
          },
          {
            start: '14:00',
            end: '18:00',
            isAvailable: true,
            maxBookings: 8,
            currentBookings: 6,
          },
        ],
        friday: [
          {
            start: '09:00',
            end: '12:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 2,
          },
          {
            start: '14:00',
            end: '17:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 1,
          },
        ],
        saturday: [],
        sunday: [],
        timezone: 'Europe/Paris',
      },
      pricing: {
        basePrice: 60,
        currency: 'EUR',
        pricingModel: 'FIXED',
        discounts: [
          {
            type: 'PERCENTAGE',
            value: 10,
            conditions: 'Étudiants avec carte valide',
          },
        ],
      },
      documents: [
        {
          id: 'doc-1',
          name: 'Diplôme de Médecine',
          type: 'CERTIFICATE',
          url: 'https://example.com/docs/diplome-dupont.pdf',
          uploadedAt: new Date('2023-01-15'),
        },
        {
          id: 'doc-2',
          name: 'Ordre des Médecins',
          type: 'LICENSE',
          url: 'https://example.com/docs/license-dupont.pdf',
          uploadedAt: new Date('2023-01-15'),
          expiresAt: new Date('2025-12-31'),
        },
      ],
    },
    apiGeo: [
      {
        place_id: 123456,
        licence: 'Data © OpenStreetMap contributors, ODbL 1.0',
        osm_type: 'way',
        osm_id: 789012,
        lat: '48.8316',
        lon: '2.3572',
        class: 'building',
        type: 'commercial',
        place_rank: 30,
        importance: 0.201,
        addresstype: 'building',
        name: 'Cabinet Médical',
        display_name: '10 Rue de la Santé, 75013 Paris, France',
        boundingbox: ['48.8310', '48.8320', '2.3560', '2.3580'],
      },
    ],
    oauth: {
      google: { linked: true, providerAccountId: 'google-dupont' },
      facebook: { linked: false, providerAccountId: null },
    },
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    images: ['https://randomuser.me/api/portraits/men/11.jpg'],
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
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
    },
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    phone: '+33987654321',
    address: '25 Avenue des Champs-Élysées, 75008 Paris, France',
    roles: ['CUSTOMER'],
    status: 'ACTIVE',
    emailVerified: true,
    isEmailVerified: true,
    password: '$2a$12$hashedpassword456', // Mot de passe hashé pour les tests
    clientNotes: 'Cliente fidèle, préfère les rendez-vous en matinée',
    oauth: {
      google: { linked: false, providerAccountId: null },
      facebook: { linked: true, providerAccountId: 'fb-marie' },
    },
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    images: ['https://randomuser.me/api/portraits/women/12.jpg'],
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
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
    },
    apiGeo: [],
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
    isEmailVerified: true,
    password: '$2a$12$hashedpassword789', // Mot de passe hashé pour les tests
    oauth: {
      google: { linked: false, providerAccountId: null },
      facebook: { linked: false, providerAccountId: null },
    },
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    images: ['https://randomuser.me/api/portraits/men/1.jpg'],
    firstName: 'Admin',
    lastName: 'Système',
    marketingConsent: false,
    kycConsent: true,
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
    },
    apiGeo: [],
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    name: 'Dr. Sophie Laurent',
    email: 'sophie.laurent@example.com',
    phone: '+33987654322',
    company: 'Clinique Cardiologique Laurent',
    address: '25 Avenue des Champs-Élysées, 75008 Paris, France',
    roles: ['PROVIDER'],
    status: 'ACTIVE',
    emailVerified: true,
    isEmailVerified: true,
    password: '$2a$12$hashedpassword456',
    specialty: 'Cardiologie',
    recommended: true,
    providerInfo: {
      type: 'INDIVIDUAL',
      category: 'HEALTH',
      specialties: ['Cardiologie', 'Médecine interne'],
      description: "Cardiologue avec 12 ans d'expérience",
      rating: 4.9,
      reviewCount: 89,
      isVerified: true,
      individual: {
        firstName: 'Sophie',
        lastName: 'Laurent',
        dateOfBirth: new Date('1985-03-15'),
        qualifications: [
          'Doctorat en médecine',
          'Spécialisation cardiologie',
          "Diplôme d'échocardiographie",
        ],
        experience: 12,
        languages: ['Français', 'Anglais', 'Espagnol'],
      },
      professionalContact: {
        phone: '+33987654322',
        email: 'sophie.laurent@example.com',
        website: 'https://drlaurent-cardiologie.com',
      },
      professionalAddress: {
        street: '25 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
        coordinates: {
          latitude: 48.8698,
          longitude: 2.3077,
        },
      },
      availability: {
        monday: [
          {
            start: '10:00',
            end: '13:00',
            isAvailable: true,
            maxBookings: 4,
            currentBookings: 2,
          },
          {
            start: '15:00',
            end: '19:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 4,
          },
        ],
        tuesday: [
          {
            start: '10:00',
            end: '13:00',
            isAvailable: true,
            maxBookings: 4,
            currentBookings: 1,
          },
          {
            start: '15:00',
            end: '19:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 3,
          },
        ],
        wednesday: [],
        thursday: [
          {
            start: '10:00',
            end: '13:00',
            isAvailable: true,
            maxBookings: 4,
            currentBookings: 3,
          },
          {
            start: '15:00',
            end: '19:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 5,
          },
        ],
        friday: [
          {
            start: '10:00',
            end: '13:00',
            isAvailable: true,
            maxBookings: 4,
            currentBookings: 2,
          },
        ],
        saturday: [],
        sunday: [],
        timezone: 'Europe/Paris',
      },
      pricing: {
        basePrice: 100,
        currency: 'EUR',
        pricingModel: 'FIXED',
        discounts: [],
      },
      documents: [
        {
          id: 'doc-3',
          name: 'Diplôme Cardiologie',
          type: 'CERTIFICATE',
          url: 'https://example.com/docs/cardio-laurent.pdf',
          uploadedAt: new Date('2023-02-10'),
        },
        {
          id: 'doc-4',
          name: 'Ordre des Médecins',
          type: 'LICENSE',
          url: 'https://example.com/docs/license-laurent.pdf',
          uploadedAt: new Date('2023-02-10'),
          expiresAt: new Date('2025-12-31'),
        },
      ],
    },
    apiGeo: [
      {
        place_id: 234567,
        licence: 'Data © OpenStreetMap contributors, ODbL 1.0',
        osm_type: 'way',
        osm_id: 890123,
        lat: '48.8698',
        lon: '2.3077',
        class: 'building',
        type: 'commercial',
        place_rank: 30,
        importance: 0.301,
        addresstype: 'building',
        name: 'Clinique Cardiologique',
        display_name: '25 Avenue des Champs-Élysées, 75008 Paris, France',
        boundingbox: ['48.8690', '48.8700', '2.3070', '2.3080'],
      },
    ],
    oauth: {
      google: { linked: false, providerAccountId: null },
      facebook: { linked: true, providerAccountId: 'fb-sophie' },
    },
    avatar: 'https://randomuser.me/api/portraits/women/15.jpg',
    images: ['https://randomuser.me/api/portraits/women/15.jpg'],
    firstName: 'Sophie',
    lastName: 'Laurent',
    dateOfBirth: new Date('1985-03-15'),
    countryOfResidence: 'France',
    targetCountry: 'Canada',
    targetCity: 'Vancouver',
    selectedServices: 'Consultation cardiologique, Échocardiographie',
    monthlyBudget: '800-1200',
    marketingConsent: true,
    kycConsent: true,
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
    },
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    name: 'Dr. Pierre Moreau',
    email: 'pierre.moreau@example.com',
    phone: '+33987654323',
    company: 'Centre Médical Urgence',
    address: '15 Boulevard Saint-Germain, 75005 Paris, France',
    roles: ['PROVIDER'],
    status: 'ACTIVE',
    emailVerified: true,
    isEmailVerified: true,
    password: '$2a$12$hashedpassword789',
    specialty: "Médecine d'urgence",
    recommended: false,
    providerInfo: {
      type: 'INDIVIDUAL',
      category: 'HEALTH',
      specialties: ["Médecine d'urgence", 'Traumatologie'],
      description: "Médecin urgentiste avec 8 ans d'expérience",
      rating: 4.6,
      reviewCount: 45,
      isVerified: true,
      individual: {
        firstName: 'Pierre',
        lastName: 'Moreau',
        dateOfBirth: new Date('1988-11-22'),
        qualifications: [
          'Doctorat en médecine',
          "Spécialisation médecine d'urgence",
          'Diplôme de réanimation',
        ],
        experience: 8,
        languages: ['Français', 'Anglais'],
      },
      professionalContact: {
        phone: '+33987654323',
        email: 'pierre.moreau@example.com',
        website: 'https://drmoreau-urgence.com',
      },
      professionalAddress: {
        street: '15 Boulevard Saint-Germain',
        city: 'Paris',
        postalCode: '75005',
        country: 'France',
        coordinates: {
          latitude: 48.8534,
          longitude: 2.3488,
        },
      },
      availability: {
        monday: [
          {
            start: '08:00',
            end: '20:00',
            isAvailable: true,
            maxBookings: 12,
            currentBookings: 5,
          },
        ],
        tuesday: [
          {
            start: '08:00',
            end: '20:00',
            isAvailable: true,
            maxBookings: 12,
            currentBookings: 7,
          },
        ],
        wednesday: [
          {
            start: '08:00',
            end: '20:00',
            isAvailable: true,
            maxBookings: 12,
            currentBookings: 4,
          },
        ],
        thursday: [
          {
            start: '08:00',
            end: '20:00',
            isAvailable: true,
            maxBookings: 12,
            currentBookings: 9,
          },
        ],
        friday: [
          {
            start: '08:00',
            end: '20:00',
            isAvailable: true,
            maxBookings: 12,
            currentBookings: 6,
          },
        ],
        saturday: [
          {
            start: '09:00',
            end: '14:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 2,
          },
        ],
        sunday: [
          {
            start: '09:00',
            end: '14:00',
            isAvailable: true,
            maxBookings: 6,
            currentBookings: 3,
          },
        ],
        timezone: 'Europe/Paris',
      },
      pricing: {
        basePrice: 80,
        currency: 'EUR',
        pricingModel: 'FIXED',
        discounts: [],
      },
      documents: [
        {
          id: 'doc-5',
          name: 'Diplôme Urgence',
          type: 'CERTIFICATE',
          url: 'https://example.com/docs/urgence-moreau.pdf',
          uploadedAt: new Date('2023-03-05'),
        },
        {
          id: 'doc-6',
          name: 'Ordre des Médecins',
          type: 'LICENSE',
          url: 'https://example.com/docs/license-moreau.pdf',
          uploadedAt: new Date('2023-03-05'),
          expiresAt: new Date('2025-12-31'),
        },
      ],
    },
    apiGeo: [
      {
        place_id: 345678,
        licence: 'Data © OpenStreetMap contributors, ODbL 1.0',
        osm_type: 'way',
        osm_id: 901234,
        lat: '48.8534',
        lon: '2.3488',
        class: 'building',
        type: 'commercial',
        place_rank: 30,
        importance: 0.251,
        addresstype: 'building',
        name: 'Centre Médical Urgence',
        display_name: '15 Boulevard Saint-Germain, 75005 Paris, France',
        boundingbox: ['48.8530', '48.8540', '2.3480', '2.3490'],
      },
    ],
    oauth: {
      google: { linked: true, providerAccountId: 'google-pierre' },
      facebook: { linked: false, providerAccountId: null },
    },
    avatar: 'https://randomuser.me/api/portraits/men/25.jpg',
    images: ['https://randomuser.me/api/portraits/men/25.jpg'],
    firstName: 'Pierre',
    lastName: 'Moreau',
    dateOfBirth: new Date('1988-11-22'),
    countryOfResidence: 'France',
    targetCountry: 'Canada',
    targetCity: 'Montréal',
    selectedServices: "Consultation d'urgence, Traitement d'urgence",
    monthlyBudget: '600-900',
    marketingConsent: false,
    kycConsent: true,
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
    },
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

// ============================================================================
// MOCK DISPONIBILITÉS (AVAILABILITIES)
// ============================================================================

export const MOCK_AVAILABILITIES = [
  {
    id: '1',
    name: 'Planning hebdomadaire standard',
    type: 'weekly',
    isActive: true,
    startDate: undefined,
    endDate: undefined,
    timeSlots: [
      {
        id: 'slot-1',
        dayOfWeek: 1, // Lundi
        startTime: '09:00',
        endTime: '17:00',
        start: '09:00',
        end: '17:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 8,
      },
      {
        id: 'slot-2',
        dayOfWeek: 2, // Mardi
        startTime: '09:00',
        endTime: '17:00',
        start: '09:00',
        end: '17:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 8,
      },
      {
        id: 'slot-3',
        dayOfWeek: 3, // Mercredi
        startTime: '09:00',
        endTime: '17:00',
        start: '09:00',
        end: '17:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 8,
      },
      {
        id: 'slot-4',
        dayOfWeek: 4, // Jeudi
        startTime: '09:00',
        endTime: '17:00',
        start: '09:00',
        end: '17:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 8,
      },
      {
        id: 'slot-5',
        dayOfWeek: 5, // Vendredi
        startTime: '09:00',
        endTime: '17:00',
        start: '09:00',
        end: '17:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 8,
      },
    ],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Planning du weekend',
    type: 'weekly',
    isActive: true,
    startDate: undefined,
    endDate: undefined,
    timeSlots: [
      {
        id: 'slot-6',
        dayOfWeek: 6, // Samedi
        startTime: '10:00',
        endTime: '16:00',
        start: '10:00',
        end: '16:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 6,
      },
      {
        id: 'slot-7',
        dayOfWeek: 0, // Dimanche
        startTime: '10:00',
        endTime: '16:00',
        start: '10:00',
        end: '16:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 6,
      },
    ],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Planning mensuel - Janvier 2024',
    type: 'monthly',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    timeSlots: [
      {
        id: 'slot-8',
        dayOfWeek: 1, // Lundi
        startTime: '08:00',
        endTime: '18:00',
        start: '08:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 10,
      },
      {
        id: 'slot-9',
        dayOfWeek: 2, // Mardi
        startTime: '08:00',
        endTime: '18:00',
        start: '08:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 10,
      },
      {
        id: 'slot-10',
        dayOfWeek: 3, // Mercredi
        startTime: '08:00',
        endTime: '18:00',
        start: '08:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 10,
      },
      {
        id: 'slot-11',
        dayOfWeek: 4, // Jeudi
        startTime: '08:00',
        endTime: '18:00',
        start: '08:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 10,
      },
      {
        id: 'slot-12',
        dayOfWeek: 5, // Vendredi
        startTime: '08:00',
        endTime: '18:00',
        start: '08:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 10,
      },
    ],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Planning personnalisé - Congés',
    type: 'custom',
    isActive: false,
    startDate: '2024-02-15',
    endDate: '2024-02-20',
    timeSlots: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '5',
    name: 'Planning urgence',
    type: 'weekly',
    isActive: true,
    startDate: undefined,
    endDate: undefined,
    timeSlots: [
      {
        id: 'slot-13',
        dayOfWeek: 0, // Dimanche
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-14',
        dayOfWeek: 1, // Lundi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-15',
        dayOfWeek: 2, // Mardi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-16',
        dayOfWeek: 3, // Mercredi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-17',
        dayOfWeek: 4, // Jeudi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-18',
        dayOfWeek: 5, // Vendredi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
      {
        id: 'slot-19',
        dayOfWeek: 6, // Samedi
        startTime: '08:00',
        endTime: '20:00',
        start: '08:00',
        end: '20:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 12,
      },
    ],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '6',
    name: 'Planning spécialisé - Consultations',
    type: 'weekly',
    isActive: true,
    startDate: undefined,
    endDate: undefined,
    timeSlots: [
      {
        id: 'slot-20',
        dayOfWeek: 1, // Lundi
        startTime: '14:00',
        endTime: '18:00',
        start: '14:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 4,
      },
      {
        id: 'slot-21',
        dayOfWeek: 3, // Mercredi
        startTime: '14:00',
        endTime: '18:00',
        start: '14:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 4,
      },
      {
        id: 'slot-22',
        dayOfWeek: 5, // Vendredi
        startTime: '14:00',
        endTime: '18:00',
        start: '14:00',
        end: '18:00',
        isAvailable: true,
        isActive: true,
        maxBookings: 4,
      },
    ],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    timezone: 'Europe/Paris',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

export const mockAvailabilities = MOCK_AVAILABILITIES;

// Fonction pour obtenir une disponibilité par ID
export const getMockAvailabilityById = (id: string) =>
  MOCK_AVAILABILITIES.find(availability => availability.id === id);

// Fonction pour obtenir les disponibilités par type
export const getMockAvailabilitiesByType = (
  type: 'weekly' | 'monthly' | 'custom'
) => MOCK_AVAILABILITIES.filter(availability => availability.type === type);

// Fonction pour obtenir les disponibilités actives
export const getMockActiveAvailabilities = () =>
  MOCK_AVAILABILITIES.filter(availability => availability.isActive);

// Fonction pour obtenir les créneaux horaires d'un jour spécifique
export const getMockTimeSlotsByDay = (
  availabilityId: string,
  dayOfWeek: number
) => {
  const availability = getMockAvailabilityById(availabilityId);
  if (!availability) return [];

  return availability.timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
};

// Fonction pour générer des créneaux horaires pour une disponibilité
export const generateMockTimeSlots = (
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  maxBookings: number = 8
) => ({
  id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  dayOfWeek,
  startTime,
  endTime,
  start: startTime,
  end: endTime,
  isAvailable: true,
  isActive: true,
  maxBookings,
});

// ============================================================================
// FONCTIONS UTILITAIRES POUR LES DISPONIBILITÉS DES UTILISATEURS
// ============================================================================

// Fonction pour obtenir les disponibilités d'un utilisateur
export const getUserAvailabilities = (userId: string) => {
  const user = getMockUserById(userId);
  if (!user || !(user as any)?.availabilities) return [] as any;
  console.log('user', user);
  return (user as any)?.availabilities
    .map((availabilityId: string) => getMockAvailabilityById(availabilityId))
    .filter(Boolean);
};

// Fonction pour obtenir les disponibilités actives d'un utilisateur
export const getUserActiveAvailabilities = (userId: string) => {
  const availabilities = getUserAvailabilities(userId);
  return availabilities.filter((availability: any) => availability?.isActive);
};

// Fonction pour ajouter une disponibilité à un utilisateur
export const addAvailabilityToUser = (
  userId: string,
  availabilityId: string
) => {
  const user = getMockUserById(userId);
  if (!user || !(user as any)?.availabilities) return false;

  (user as any)?.availabilities?.push(availabilityId as never);
  return true;
};

// Fonction pour retirer une disponibilité d'un utilisateur
export const removeAvailabilityFromUser = (
  userId: string,
  availabilityId: string
) => {
  const user = getMockUserById(userId);
  if (!user || !(user as any)?.availabilities) return false;

  const index = (user as any)?.availabilities?.indexOf(availabilityId as never);
  if (index > -1) {
    (user as any)?.availabilities?.splice(index, 1);
    return true;
  }

  return false;
};

// Fonction pour obtenir les créneaux horaires d'un utilisateur pour un jour spécifique
export const getUserTimeSlotsForDay = (userId: string, dayOfWeek: number) => {
  const availabilities = getUserActiveAvailabilities(userId);
  const timeSlots: any[] = [];

  availabilities.forEach((availability: any) => {
    const daySlots = availability?.timeSlots?.filter(
      (slot: any) => slot?.dayOfWeek === dayOfWeek
    );
    if (Array.isArray(daySlots)) {
      timeSlots.push(...daySlots);
    }
  });

  return timeSlots;
};

// Fonction pour obtenir tous les créneaux horaires d'un utilisateur
export const getAllUserTimeSlots = (userId: string) => {
  const availabilities = getUserActiveAvailabilities(userId);
  const timeSlots: any[] = [];

  availabilities.forEach((availability: any) => {
    if (Array.isArray(availability?.timeSlots)) {
      timeSlots.push(...availability.timeSlots);
    }
  });

  return timeSlots;
};

// Fonction pour vérifier si un utilisateur est disponible à un moment donné
export const isUserAvailableAtTime = (
  userId: string,
  dayOfWeek: number,
  time: string
) => {
  const timeSlots = getUserTimeSlotsForDay(userId, dayOfWeek);

  return timeSlots.some(slot => {
    return (
      slot.isActive &&
      slot.isAvailable &&
      time >= slot.startTime &&
      time < slot.endTime
    );
  });
};

// Fonction pour obtenir les utilisateurs avec des disponibilités spécifiques
export const getUsersWithAvailability = (availabilityId: string) => {
  return MOCK_USERS.filter(
    (user: any) =>
      user.availabilities &&
      user.availabilities.includes(availabilityId as never)
  );
};

// Fonction pour obtenir les utilisateurs disponibles un jour donné
export const getAvailableUsersForDay = (dayOfWeek: number) => {
  return MOCK_USERS.filter((user: any) => {
    if (!user?.availabilities) return false;

    const userAvailabilities = getUserAvailabilities(user._id);
    return userAvailabilities.some((availability: any) => {
      if (!availability?.isActive) return false;

      return availability?.timeSlots?.some(
        (slot: any) =>
          slot.dayOfWeek === dayOfWeek && slot.isActive && slot.isAvailable
      );
    });
  });
};

// ============================================================================
// FONCTIONS DE VALIDATION ET UTILITAIRES AVANCÉES
// ============================================================================

// Fonction pour valider une disponibilité
export const validateAvailability = (availability: any): boolean => {
  return !!(
    availability &&
    availability.id &&
    availability.name &&
    availability.type &&
    typeof availability.isActive === 'boolean'
  );
};

// Fonction pour valider un créneau horaire
export const validateTimeSlot = (timeSlot: any): boolean => {
  return !!(
    timeSlot &&
    timeSlot.id &&
    typeof timeSlot.dayOfWeek === 'number' &&
    timeSlot.startTime &&
    timeSlot.endTime &&
    typeof timeSlot.isActive === 'boolean' &&
    typeof timeSlot.isAvailable === 'boolean'
  );
};

// Fonction pour obtenir un résumé des disponibilités d'un utilisateur
export const getUserAvailabilitySummary = (userId: string) => {
  const user = getMockUserById(userId);
  if (!user) return null;

  const availabilities = getUserAvailabilities(userId);
  const activeAvailabilities = getUserActiveAvailabilities(userId);
  const totalTimeSlots = getAllUserTimeSlots(userId);

  return {
    userId,
    userName: user.name,
    totalAvailabilities: availabilities.length,
    activeAvailabilities: activeAvailabilities.length,
    totalTimeSlots: totalTimeSlots.length,
    weeklySchedule: {
      monday: getUserTimeSlotsForDay(userId, 1).length,
      tuesday: getUserTimeSlotsForDay(userId, 2).length,
      wednesday: getUserTimeSlotsForDay(userId, 3).length,
      thursday: getUserTimeSlotsForDay(userId, 4).length,
      friday: getUserTimeSlotsForDay(userId, 5).length,
      saturday: getUserTimeSlotsForDay(userId, 6).length,
      sunday: getUserTimeSlotsForDay(userId, 0).length,
    },
  };
};

// Fonction pour obtenir les statistiques globales des disponibilités
export const getAvailabilityStats = () => {
  const totalUsers = MOCK_USERS.length;
  const usersWithAvailabilities = MOCK_USERS.filter(
    (user: any) => user?.availabilities && user?.availabilities?.length > 0
  ).length;

  const totalAvailabilities = MOCK_AVAILABILITIES.length;
  const activeAvailabilities = MOCK_AVAILABILITIES.filter(
    (av: any) => av.isActive
  ).length;

  const totalTimeSlots = MOCK_AVAILABILITIES.reduce(
    (total, av) => total + (av.timeSlots?.length || 0),
    0
  );

  return {
    totalUsers,
    usersWithAvailabilities,
    percentageWithAvailabilities: Math.round(
      (usersWithAvailabilities / totalUsers) * 100
    ),
    totalAvailabilities,
    activeAvailabilities,
    totalTimeSlots,
  };
};
