// ============================================================================
// MOCKS CENTRALISÉS
// ============================================================================

import {
  ApiGeoLocation,
  IAppointment,
  IInvoice,
  IReview,
  ISpeciality,
  IUser,
} from "@/types";

// ============================================================================
// MOCK USERS
// ============================================================================

export const MOCK_USERS: IUser[] = [
  // ADMIN users
  {
    _id: "1",
    id: "1",
    email: "admin@diaspomoney.com",
    password: "password123",
    name: "Admin User (Active)",
    roles: ["ADMIN"],
    status: "ACTIVE",
    price: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    id: "2",
    price: 0,
    email: "admin.inactive@diaspomoney.com",
    password: "password123",
    name: "Admin User (Inactive)",
    roles: ["ADMIN"],
    status: "INACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "3",
    id: "3",
    price: 0,
    email: "admin.pending@diaspomoney.com",
    password: "password123",
    name: "Admin User (Pending)",
    roles: ["ADMIN"],
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "4",
    id: "4",
    price: 0,
    email: "admin.suspended@diaspomoney.com",
    password: "password123",
    name: "Admin User (Suspended)",
    roles: ["ADMIN"],
    status: "SUSPENDED",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // PROVIDER users
  {
    _id: "5",
    id: "5",
    price: 0,
    email: "provider@diaspomoney.com",
    password: "password123",
    name: "Provider User (Active)",
    roles: ["PROVIDER"],
    status: "ACTIVE",
    specialty: "Médecine générale",
    company: "Clinique Horizon",
    phone: "+33 1 23 45 67 89",
    address: "12 Rue de la Paix, 75002 Paris",
    // @ts-expect-error profileImage is used for mock/testing purposes
    profileImage: "/img/avatars/doctor.jpg",
    description:
      "Médecin généraliste avec 10 ans d'expérience, orienté patient.",
    rating: 4.6,
    selectedServices: "Consultation, Suivi, Téléconsultation",
    apiGeo: [
      { name: "France" } as ApiGeoLocation,
      { name: "Belgique" } as ApiGeoLocation,
    ],
    images: [
      "/img/providers/clinic-1.jpg",
      "/img/providers/clinic-2.jpg",
      "/img/providers/clinic-3.jpg",
    ],
    recommended: true,
    availabilities: ["09:00-09:30", "10:00-10:30", "14:00-14:30"],
    appointments: [{ start: "10:00", end: "10:30" }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "6",
    id: "6",
    price: 0,
    email: "provider.inactive@diaspomoney.com",
    password: "password123",
    name: "Provider User (Inactive)",
    roles: ["PROVIDER"],
    status: "INACTIVE",
    specialty: "Droit civil",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "7",
    id: "7",
    price: 0,
    email: "provider.pending@diaspomoney.com",
    password: "password123",
    name: "Provider User (Pending)",
    roles: ["PROVIDER"],
    status: "PENDING",
    specialty: "Immobilier",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "8",
    id: "8",
    price: 0,
    email: "provider.suspended@diaspomoney.com",
    password: "password123",
    name: "Provider User (Suspended)",
    roles: ["PROVIDER"],
    status: "SUSPENDED",
    specialty: "Formation",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CUSTOMER users
  {
    _id: "9",
    id: "9",
    price: 0,
    email: "customer@diaspomoney.com",
    password: "password123",
    name: "Customer User (Active)",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "10",
    id: "10",
    price: 0,
    email: "customer.inactive@diaspomoney.com",
    password: "password123",
    name: "Customer User (Inactive)",
    roles: ["CUSTOMER"],
    status: "INACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "11",
    id: "11",
    price: 0,
    email: "customer.pending@diaspomoney.com",
    password: "password123",
    name: "Customer User (Pending)",
    roles: ["CUSTOMER"],
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "12",
    id: "12",
    price: 0,
    email: "customer.suspended@diaspomoney.com",
    password: "password123",
    name: "Customer User (Suspended)",
    roles: ["CUSTOMER"],
    status: "SUSPENDED",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CSM users
  {
    _id: "13",
    id: "13",
    price: 0,
    email: "csm@diaspomoney.com",
    password: "password123",
    name: "CSM User (Active)",
    roles: ["CSM"],
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "14",
    id: "14",
    price: 0,
    email: "csm.inactive@diaspomoney.com",
    password: "password123",
    name: "CSM User (Inactive)",
    roles: ["CSM"],
    status: "INACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "15",
    id: "15",
    price: 0,
    email: "csm.pending@diaspomoney.com",
    password: "password123",
    name: "CSM User (Pending)",
    roles: ["CSM"],
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "16",
    id: "16",
    price: 0,
    email: "csm.suspended@diaspomoney.com",
    password: "password123",
    name: "CSM User (Suspended)",
    roles: ["CSM"],
    status: "SUSPENDED",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Utilisateurs avec plusieurs rôles
  {
    _id: "17",
    id: "17",
    price: 0,
    email: "admin.provider@diaspomoney.com",
    password: "password123",
    name: "Admin & Provider User",
    roles: ["ADMIN", "PROVIDER"],
    status: "ACTIVE",
    specialty: "Médecine générale",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "18",
    id: "18",
    price: 0,
    email: "provider.customer@diaspomoney.com",
    password: "password123",
    name: "Provider & Customer User",
    roles: ["PROVIDER", "CUSTOMER"],
    status: "ACTIVE",
    specialty: "Formation",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "19",
    id: "19",
    price: 0,
    email: "admin.csm@diaspomoney.com",
    password: "password123",
    name: "Admin & CSM User",
    roles: ["ADMIN", "CSM"],
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "20",
    id: "20",
    price: 0,
    email: "all.roles@diaspomoney.com",
    password: "password123",
    name: "Super User (All Roles)",
    roles: ["ADMIN", "PROVIDER", "CUSTOMER", "CSM"],
    status: "ACTIVE",
    specialty: "Immobilier",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // example with all fields (provider)
  {
    _id: "21",
    id: "21",
    price: 0,
    email: "leldoradoecole@gmail.com",
    password: "password123",
    name: "L'ELDORADO Crèche, Maternelle, Primaire et Collège",
    roles: ["PROVIDER"],
    status: "ACTIVE",
    specialty: "Ecole",
    createdAt: new Date(),
    updatedAt: new Date(),
    recommended: true,
    apiGeo: [
      {
        place_id: 34433693,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 282206904,
        lat: "-4.8028152",
        lon: "11.8493289",
        class: "highway",
        type: "tertiary",
        place_rank: 26,
        importance: 0.0533886800946059,
        addresstype: "road",
        name: "Avenue Dr Denis Loemba",
        display_name:
          "Avenue Dr Denis Loemba, Losange, Pointe-Noire, Lumumba (arrondissement 1), Pointe-Noire (commune), Pointe-Noire (département), Congo-Brazzaville",
        boundingbox: ["-4.8039035", "-4.8011078", "11.8483804", "11.8499445"],
        country_code: "CG",
        country: "Congo-Brazzaville",
      },
      {
        place_id: 34536773,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 282206905,
        lat: "-4.7999258",
        lon: "11.8468548",
        class: "highway",
        type: "residential",
        place_rank: 26,
        importance: 0.0533886800946059,
        addresstype: "road",
        name: "Avenue Dr Denis Loemba",
        display_name:
          "Avenue Dr Denis Loemba, Losange, Pointe-Noire, Lumumba (arrondissement 1), Pointe-Noire (commune), Pointe-Noire (département), Congo-Brazzaville",
        boundingbox: ["-4.8006448", "-4.7991889", "11.8457698", "11.8479518"],
        country_code: "CG",
        country: "Congo-Brazzaville",
      },
    ],
    images: [
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.48.28_5aea9ba3.jpg",
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.48.58_75ac2158.jpg",
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.50.52_a84da04f.jpg",
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.51.14_1a4de652.jpg",
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.51.55_bcb3c284.jpg",
      "/img/users/providers/WhatsApp Image 2025-09-06 à 13.53.54_0027f54c.jpg",
    ],
    rating: 4.5,
    reviews: 10,
    distance: "10km",
    availabilities: ["09:00-09:30", "10:00-10:30", "14:00-14:30"],
    appointmentsAsProvider: [{ time: "10:00-10:30" } as IAppointment],
    clientNotes: "Notes client",
    avatar: {
      image: "/img/users/WhatsApp Image 2025-09-06 à 13.47.15_68fe173d.jpg",
      name: "L'ELDORADO Crèche, Maternelle, Primaire et Collège",
    },
    preferences: {
      language: "fr",
      timezone: "Europe/Paris",
      notifications: true,
    },
    emailVerified: true,
    image: "/img/providers/clinic-1.jpg",
    dateOfBirth: new Date("1990-01-01"),
    countryOfResidence: "France",
    targetCountry: "France",
    targetCity: "Paris",
    selectedServices:
      "Halte garderie, Maternelle, Primaire, Collège, Crèche, Cantine Scolaire, Projet Voltaire (Partenaire), CNED (Partenaire)",
    monthlyBudget: "1000",
    securityQuestion: "What is your mother's maiden name?",
    securityAnswer: "Smith",
    marketingConsent: true,
    kycConsent: true,
  },
];

// ============================================================================
// MOCK APPOINTMENTS
// ============================================================================

export const MOCK_APPOINTMENTS: IAppointment[] = [
  {
    _id: "1",
    userId: "9",
    providerId: "5",
    serviceId: "1",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours ago
    time: "10:00",
    status: "confirmed",
    notes: "Consultation de routine",
    price: 50,
    paymentStatus: "paid",
    paymentMethod: "card",
    paymentId: "pay_123",
    reservationNumber: "RDV-001",
    requester: {
      firstName: "Jean",
      lastName: "Dupont",
      phone: "+33123456789",
      email: "jean.dupont@email.com",
    },
    recipient: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "+33123456790",
    },
    provider: {
      id: "5",
      name: "Dr. Martin",
      services: [{ id: 1, name: "Consultation", price: 50 }],
      type: { id: "1", value: "Médecine", group: "sante" as const },
      specialty: "Médecine générale",
      recommended: true,
      apiGeo: [],
      images: [],
      rating: 4.5,
    },
    selectedService: { id: 1, name: "Consultation", price: 50 },
    timeslot: "2024-01-15 10:00",
    totalAmount: 50,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 jours ago
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 jours ago
  },
  {
    _id: "2",
    userId: "10",
    providerId: "6",
    serviceId: "2",
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 jours ago
    time: "14:00",
    status: "pending",
    notes: "Conseil juridique",
    price: 100,
    paymentStatus: "pending",
    reservationNumber: "RDV-002",
    requester: {
      firstName: "Sophie",
      lastName: "Bernard",
      phone: "+33123456791",
      email: "sophie.bernard@email.com",
    },
    recipient: {
      firstName: "Pierre",
      lastName: "Durand",
      phone: "+33123456792",
    },
    provider: {
      id: "6",
      name: "Me. Dubois",
      services: [{ id: 2, name: "Conseil juridique", price: 100 }],
      type: { id: "2", value: "Droit", group: "edu" as const },
      specialty: "Droit civil",
      recommended: false,
      apiGeo: [],
      images: [],
      rating: 4.2,
    },
    selectedService: { id: 2, name: "Conseil juridique", price: 100 },
    timeslot: "2024-01-20 14:00",
    totalAmount: 100,
    createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 jours ago
    updatedAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 jours ago
  },
  {
    _id: "3",
    userId: "11",
    providerId: "7",
    serviceId: "3",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 jours ago
    time: "16:00",
    status: "cancelled",
    notes: "Annulé par le client",
    price: 75,
    paymentStatus: "refunded",
    cancellationReason: "Changement de plans",
    cancelledAt: new Date("2024-01-20T10:00:00Z"),
    cancelledBy: "client",
    reservationNumber: "RDV-003",
    requester: {
      firstName: "Luc",
      lastName: "Moreau",
      phone: "+33123456793",
      email: "luc.moreau@email.com",
    },
    recipient: {
      firstName: "Anne",
      lastName: "Leroy",
      phone: "+33123456794",
    },
    provider: {
      id: "7",
      name: "Agence Immobilière",
      services: [{ id: 3, name: "Visite immobilière", price: 75 }],
      type: { id: "3", value: "Immobilier", group: "immo" as const },
      specialty: "Immobilier",
      recommended: true,
      apiGeo: [],
      images: [],
      rating: 4.8,
    },
    selectedService: { id: 3, name: "Visite immobilière", price: 75 },
    timeslot: "2024-01-25 16:00",
    totalAmount: 75,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours ago
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 jours ago
  },
];

// ============================================================================
// MOCK INVOICES
// ============================================================================

export const MOCK_INVOICES: IInvoice[] = [
  {
    _id: "1",
    invoiceNumber: "FACT-2024-001",
    customerId: "9",
    providerId: "5",
    amount: 50,
    currency: "EUR",
    status: "PAID",
    issueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 jours ago
    dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 jours ago
    paidDate: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 jours ago
    items: [
      {
        description: "Consultation médicale",
        quantity: 1,
        unitPrice: 50,
        total: 50,
      },
    ],
    notes: "Paiement reçu",
    userId: "9",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    _id: "2",
    invoiceNumber: "FACT-2024-002",
    customerId: "10",
    providerId: "6",
    amount: 100,
    currency: "EUR",
    status: "SENT",
    issueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 jours ago
    dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 jours ago
    paidDate: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 jours ago
    items: [
      {
        description: "Conseil juridique",
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
    ],
    notes: "En attente de paiement",
    userId: "10",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
];

// ============================================================================
// MOCK SPECIALITIES
// ============================================================================

export const MOCK_SPECIALITIES: ISpeciality[] = [
  {
    _id: "1",
    name: "Médecine générale",
    description: "Soins de santé primaires et consultations générales",
    group: "sante",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    name: "Droit civil",
    description: "Conseils juridiques en droit civil et commercial",
    group: "edu",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "3",
    name: "Immobilier",
    description: "Services immobiliers et transactions",
    group: "immo",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "4",
    name: "Formation",
    description: "Formation professionnelle et éducation",
    group: "edu",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// MOCK REVIEWS
// ============================================================================

export const MOCK_REVIEWS: IReview[] = [
  {
    _id: "1",
    author: "John Doe",
    text: "This is a review",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    author: "Jane Doe",
    text: "This is another review",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "3",
    author: "John Doe",
    text: "This is a review",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "4",
    author: "Jane Doe",
    text: "This is another review",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// UTILITAIRES MOCK
// ============================================================================

export function findUserByEmail(email: string): IUser | undefined {
  return MOCK_USERS.find(user => user.email === email);
}

export function findUserById(id: string): IUser | undefined {
  return MOCK_USERS.find(user => user._id === id);
}

export function findAppointmentById(id: string): IAppointment | undefined {
  return MOCK_APPOINTMENTS.find(appointment => appointment._id === id);
}

export function findProviderById(id: string): IUser | undefined {
  return MOCK_USERS.find(
    user => user._id === id && user.roles.includes("PROVIDER")
  );
}

export function findInvoiceById(id: string): IInvoice | undefined {
  return MOCK_INVOICES.find(invoice => invoice._id === id);
}

export function getAppointmentsByUserId(userId: string): IAppointment[] {
  return MOCK_APPOINTMENTS.filter(appointment => appointment.userId === userId);
}

export function getProvidersBySpecialty(specialty: string): IUser[] {
  return MOCK_USERS.filter(
    user => user.roles.includes("PROVIDER") && user.specialty === specialty
  );
}

export function getUsersByRole(role: string): IUser[] {
  return MOCK_USERS.filter(user => user.roles.includes(role as any));
}
