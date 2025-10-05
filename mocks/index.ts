// ============================================================================
// MOCKS CENTRALISÉS
// ============================================================================

import {
  ApiGeoLocation,
  IBooking,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    id: "2",
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
    email: "provider@diaspomoney.com",
    password: "password123",
    name: "Provider User (Active)",
    roles: ["{PROVIDER:INDIVIDUAL}"],
    status: "ACTIVE",
    specialty: "Médecine générale",
    category: "HEALTH",
    acceptsFirstConsultation: false,
    acceptsVideoConsultation: true,
    company: "Clinique Horizon",
    phone: "+33 1 23 45 67 89",
    address: "12 Rue de la Paix, 75002 Paris",
    // @ts-expect-error profileImage is used for mock/testing purposes
    profileImage: "/img/avatars/doctor.jpg",
    description:
      "Médecin généraliste avec 10 ans d'expérience, orienté patient.",
    selectedServices: "Consultation, Suivi, Téléconsultation",
    services: [
      {
        id: "consultation",
        name: "Consultation",
        price: 77,
        description: "Consultation médicale générale",
        isVideoAvailable: true,
      },
      {
        id: "suivi",
        name: "Suivi",
        price: 40,
        description: "Suivi médical",
        isVideoAvailable: true,
      },
      {
        id: "teleconsultation",
        name: "Téléconsultation",
        price: 45,
        description: "Consultation à distance",
        isVideoAvailable: true,
      },
    ],
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
    // Créneaux rapides sur 3 jours à venir, découpés en tranches de 30min
    availabilities: [
      // Jour 1 (aujourd'hui)
      "2025-10-05T09:00:00|2025-10-05T09:30:00",
      "2025-10-05T09:30:00|2025-10-05T10:00:00",
      "2025-10-05T10:00:00|2025-10-05T10:30:00",
      "2025-10-05T14:00:00|2025-10-05T14:30:00",
      "2025-10-05T14:30:00|2025-10-05T15:00:00",
      // Jour 2 (demain)
      "2025-10-06T09:00:00|2025-10-06T09:30:00",
      "2025-10-06T09:30:00|2025-10-06T10:00:00",
      "2025-10-06T10:00:00|2025-10-06T10:30:00",
      "2025-10-06T14:00:00|2025-10-06T14:30:00",
      "2025-10-06T14:30:00|2025-10-06T15:00:00",
      // Jour 3 (après-demain)
      "2025-10-07T09:00:00|2025-10-07T09:30:00",
      "2025-10-05T09:30:00|2025-10-05T10:00:00",
      "2025-10-07T10:00:00|2025-10-07T10:30:00",
      "2025-10-07T14:00:00|2025-10-07T14:30:00",
      "2025-10-07T14:30:00|2025-10-07T15:00:00",
    ],
    bookings: [{ start: "10:00", end: "10:30" }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Individual provider example
  {
    _id: "22",
    id: "22",
    email: "dr.indiv@diaspomoney.com",
    password: "password123",
    name: "Dr. Camille Leroy",
    roles: ["{PROVIDER:INDIVIDUAL}"],
    status: "ACTIVE",
    specialty: "Cardiologie",
    category: "HEALTH",
    acceptsFirstConsultation: false,
    acceptsVideoConsultation: true,
    phone: "+33 6 12 34 56 78",
    address: "25 Avenue des Champs-Élysées, 75008 Paris",
    description: "Cardiologue avec 12 ans d'expérience.",
    selectedServices: "Consultation, Téléconsultation",
    services: [
      {
        id: "consultation-cardiologie",
        name: "Consultation Cardiologie",
        price: 80,
        description: "Consultation spécialisée en cardiologie",
        isVideoAvailable: true,
      },
      {
        id: "teleconsultation-cardiologie",
        name: "Téléconsultation Cardiologie",
        price: 70,
        description: "Consultation cardiologique à distance",
        isVideoAvailable: true,
      },
    ],
    apiGeo: [{ name: "France" } as ApiGeoLocation],
    images: ["/img/providers/doctor-1.jpg"],
    recommended: true,
    // Fix: availabilities as string[]
    availabilities: [
      "2025-01-15T09:00:00|2025-01-15T09:30:00",
      "2025-01-15T11:00:00|2025-01-15T11:30:00",
      "2025-01-15T15:00:00|2025-01-15T15:30:00",
    ],
    bookingsAsProvider: [] as IBooking[],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "6",
    id: "6",
    email: "provider.inactive@diaspomoney.com",
    password: "password123",
    name: "Provider User (Inactive)",
    roles: ["{PROVIDER:INSTITUTION}"],
    status: "INACTIVE",
    specialty: "Droit civil",
    category: "EDU",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "7",
    id: "7",
    email: "provider.pending@diaspomoney.com",
    password: "password123",
    name: "Provider User (Pending)",
    roles: ["{PROVIDER:INSTITUTION}"],
    status: "PENDING",
    specialty: "Immobilier",
    category: "IMMO",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "8",
    id: "8",
    email: "provider.suspended@diaspomoney.com",
    password: "password123",
    name: "Provider User (Suspended)",
    roles: ["{PROVIDER:INSTITUTION}"],
    status: "SUSPENDED",
    specialty: "Formation",
    category: "EDU",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CUSTOMER users
  {
    _id: "9",
    id: "9",
    email: "customer@diaspomoney.com",
    password: "password123",
    name: "Customer User (Active)",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
    addresses: {
      addresses: [
        {
          id: "addr1",
          country: "France",
          address1: "123 Rue de la Paix",
          address2: "Appartement 4B",
          postalCode: "75001",
          city: "Paris",
          isDefault: true,
          isBillingDefault: true,
        },
        {
          id: "addr2",
          country: "France",
          address1: "456 Avenue des Champs-Élysées",
          postalCode: "75008",
          city: "Paris",
          isDefault: false,
          isBillingDefault: false,
        },
      ],
      defaultBillingAddress: "addr1",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "10",
    id: "10",
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
    email: "admin.provider@diaspomoney.com",
    password: "password123",
    name: "Admin & Provider User",
    roles: ["ADMIN", "{PROVIDER:INSTITUTION}"],
    status: "ACTIVE",
    specialty: "Médecine générale",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "18",
    id: "18",
    email: "provider.customer@diaspomoney.com",
    password: "password123",
    name: "Provider & Customer User",
    roles: ["{PROVIDER:INSTITUTION}", "CUSTOMER"],
    status: "ACTIVE",
    specialty: "Formation",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "19",
    id: "19",
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
    email: "all.roles@diaspomoney.com",
    password: "password123",
    name: "Super User (All Roles)",
    roles: ["ADMIN", "{PROVIDER:INSTITUTION}", "CUSTOMER", "CSM"],
    status: "ACTIVE",
    specialty: "Immobilier",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // example with all fields (provider)
  {
    _id: "21",
    id: "21",
    email: "leldoradoecole@gmail.com",
    password: "password123",
    name: "L'ELDORADO Crèche, Maternelle, Primaire et Collège",
    roles: ["{PROVIDER:INSTITUTION}"],
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
    reviews: 10,
    distance: "10km",
    // Fix: availabilities as string[]
    availabilities: [
      "2025-01-15T09:00:00|2025-01-15T09:30:00",
      "2025-01-15T10:00:00|2025-01-15T10:30:00",
      "2025-01-15T14:00:00|2025-01-15T14:30:00",
    ],
    // Removed invalid property 'appointmentsAsProvider'
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

  // EDU Provider
  {
    _id: "edu1",
    id: "edu1",
    email: "edu.formation@diaspomoney.com",
    password: "password123",
    name: "Centre de Formation Excellence",
    roles: ["{PROVIDER:INSTITUTION}"],
    status: "ACTIVE",
    specialty: "Formation professionnelle",
    category: "EDU",
    company: "Centre Excellence SARL",
    phone: "+33 1 23 45 67 90",
    address: "15 Rue de l'Éducation, 75012 Paris",
    description:
      "Centre de formation professionnelle avec 15 ans d'expérience dans l'éducation.",
    selectedServices: "Formation, Coaching, Certification",
    services: [
      {
        id: "formation",
        name: "Formation professionnelle",
        price: 800,
        description: "Formation complète dans votre domaine",
        isVideoAvailable: true,
      },
      {
        id: "coaching",
        name: "Coaching individuel",
        price: 120,
        description: "Accompagnement personnalisé",
        isVideoAvailable: true,
      },
      {
        id: "certification",
        name: "Préparation certification",
        price: 300,
        description: "Préparation aux examens et certifications",
        isVideoAvailable: true,
      },
    ],
    apiGeo: [
      {
        name: "Paris",
        country_code: "FR",
        country: "France",
        place_id: 12345,
        licence: "ODbL",
        osm_type: "N",
        osm_id: 123456,
        lat: "48.8566",
        lon: "2.3522",
        class: "place",
        type: "city",
        place_rank: 16,
        importance: 0.9,
        addresstype: "city",
        display_name: "Paris, France",
        boundingbox: ["48.8156", "48.9021", "2.2241", "2.4699"],
      },
    ],
    avatar: {
      image: "/img/avatars/education.jpg",
      name: "Centre Excellence",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // IMMO Provider
  {
    _id: "immo1",
    id: "immo1",
    email: "immo.agence@diaspomoney.com",
    password: "password123",
    name: "Agence Immobilière Horizon",
    roles: ["{PROVIDER:INSTITUTION}"],
    status: "ACTIVE",
    specialty: "Transaction immobilière",
    category: "IMMO",
    company: "Agence Horizon",
    phone: "+33 1 23 45 67 91",
    address: "20 Avenue de l'Immobilier, 75016 Paris",
    description:
      "Agence immobilière spécialisée dans la transaction et la gestion locative.",
    selectedServices: "Vente, Location, Gestion, Estimation",
    services: [
      {
        id: "vente",
        name: "Vente immobilière",
        price: 3000,
        description: "Accompagnement vente immobilière",
        isVideoAvailable: true,
      },
      {
        id: "location",
        name: "Location",
        price: 1500,
        description: "Gestion location immobilière",
        isVideoAvailable: true,
      },
      {
        id: "estimation",
        name: "Estimation",
        price: 200,
        description: "Estimation de bien immobilier",
        isVideoAvailable: true,
      },
    ],
    apiGeo: [
      {
        name: "Paris",
        country_code: "FR",
        country: "France",
        place_id: 12345,
        licence: "ODbL",
        osm_type: "N",
        osm_id: 123456,
        lat: "48.8566",
        lon: "2.3522",
        class: "place",
        type: "city",
        place_rank: 16,
        importance: 0.9,
        addresstype: "city",
        display_name: "Paris, France",
        boundingbox: ["48.8156", "48.9021", "2.2241", "2.4699"],
      },
    ],
    avatar: {
      image: "/img/avatars/immobilier.jpg",
      name: "Agence Horizon",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================================
// PARTNERS (Homepage carousel / future DB model)
// ============================================================================

export interface IPartner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: string;
  services: string[];
  location: string;
  established: string; // year as string for now
}

export const MOCK_PARTNERS: IPartner[] = [
  {
    id: "1",
    name: "Clinique Santé Plus",
    logo: "/img/partners/clinic-1.jpg",
    description:
      "Clinique médicale moderne offrant des soins de qualité avec une équipe de professionnels expérimentés. Spécialisée dans la médecine générale et les consultations spécialisées.",
    website: "https://clinique-sante-plus.com",
    category: "Santé",
    services: ["Consultations", "Examens", "Urgences", "Spécialistes"],
    location: "Dakar, Sénégal",
    established: "2015",
  },
  {
    id: "2",
    name: "Institut Éducatif Excellence",
    logo: "/img/partners/education-1.jpg",
    description:
      "Établissement d'enseignement supérieur reconnu pour son excellence académique et ses programmes innovants. Formation de qualité pour les étudiants du monde entier.",
    website: "https://institut-excellence.edu",
    category: "Éducation",
    services: ["Formations", "Certifications", "Bourses", "Orientation"],
    location: "Abidjan, Côte d'Ivoire",
    established: "2010",
  },
  {
    id: "3",
    name: "Immobilier Premium",
    logo: "/img/partners/real-estate-1.jpg",
    description:
      "Agence immobilière de référence offrant des services complets pour l'achat, la vente et la location de biens immobiliers de qualité.",
    website: "https://immobilier-premium.com",
    category: "Immobilier",
    services: ["Achat/Vente", "Location", "Gestion", "Conseil"],
    location: "Douala, Cameroun",
    established: "2012",
  },
  {
    id: "4",
    name: "Tech Solutions",
    logo: "/img/partners/tech-1.jpg",
    description:
      "Entreprise technologique innovante spécialisée dans le développement de solutions digitales pour les entreprises modernes.",
    website: "https://tech-solutions.com",
    category: "Technologie",
    services: ["Développement", "Consulting", "Formation", "Support"],
    location: "Paris, France",
    established: "2018",
  },
  {
    id: "5",
    name: "Banque Diaspora",
    logo: "/img/partners/bank-1.jpg",
    description:
      "Institution financière dédiée à la diaspora africaine, offrant des services bancaires adaptés et des solutions de transfert d'argent.",
    website: "https://banque-diaspora.com",
    category: "Finance",
    services: ["Comptes", "Transferts", "Crédits", "Investissements"],
    location: "Lyon, France",
    established: "2016",
  },
  {
    id: "6",
    name: "Lusinage",
    logo: "https://lusinage.fr/asset/images/logo/lusinage.png",
    description:
      "Conception et fabrication de pièces mécaniques de haute précision, pour vos prototypes comme vos pièces de production, en usinage CNC et impression 3D.  adaptés et des solutions de transfert d'argent.",
    website: "https://lusinage.fr",
    category: "Usinage",
    services: ["Usinage CNC", "Impression 3D"],
    location: "Rouen, France",
    established: "2021",
  },
];

// ============================================================================
// MOCK APPOINTMENTS
// ============================================================================

export const MOCK_APPOINTMENTS: IBooking[] = [
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
  // Avis pour Dr. Jean Dupont (ID: 6)
  {
    _id: "1",
    author: "Marie Dubois",
    text: "Excellent médecin, très à l'écoute et professionnel. Je recommande vivement !",
    rating: 5,
    providerId: "6",
    customerId: "customer1",
    appointmentId: "appointment1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    _id: "2",
    author: "Pierre Martin",
    text: "Très bon accueil et consultation de qualité. Le docteur a pris le temps de m'expliquer tout.",
    rating: 5,
    providerId: "6",
    customerId: "customer2",
    appointmentId: "appointment2",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    _id: "3",
    author: "Sophie Laurent",
    text: "Consultation rapide et efficace. Le médecin est très compétent.",
    rating: 4,
    providerId: "6",
    customerId: "customer3",
    appointmentId: "appointment3",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    _id: "4",
    author: "Jean Petit",
    text: "Bon médecin mais un peu pressé. Consultation correcte dans l'ensemble.",
    rating: 4,
    providerId: "6",
    customerId: "customer4",
    appointmentId: "appointment4",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    _id: "5",
    author: "Claire Moreau",
    text: "Excellent service, très professionnel et à l'écoute. Je recommande !",
    rating: 5,
    providerId: "6",
    customerId: "customer5",
    appointmentId: "appointment5",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },

  // Avis pour Dr. Sarah Johnson (ID: 7)
  {
    _id: "6",
    author: "Thomas Bernard",
    text: "Très bonne consultation, le docteur est très compétent et à l'écoute.",
    rating: 5,
    providerId: "7",
    customerId: "customer6",
    appointmentId: "appointment6",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
  },
  {
    _id: "7",
    author: "Isabelle Roux",
    text: "Consultation de qualité, je recommande ce médecin.",
    rating: 4,
    providerId: "7",
    customerId: "customer7",
    appointmentId: "appointment7",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    _id: "8",
    author: "Michel Durand",
    text: "Bon médecin mais un peu cher. Consultation correcte.",
    rating: 3,
    providerId: "7",
    customerId: "customer8",
    appointmentId: "appointment8",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },

  // Avis pour Dr. Ahmed Hassan (ID: 8)
  {
    _id: "9",
    author: "Fatima Alami",
    text: "Excellent médecin, très professionnel et compréhensif. Je recommande vivement !",
    rating: 5,
    providerId: "8",
    customerId: "customer9",
    appointmentId: "appointment9",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    _id: "10",
    author: "Omar Benali",
    text: "Très bon accueil et consultation de qualité. Le docteur prend le temps d'écouter.",
    rating: 5,
    providerId: "8",
    customerId: "customer10",
    appointmentId: "appointment10",
    createdAt: new Date("2024-02-08"),
    updatedAt: new Date("2024-02-08"),
  },
  {
    _id: "11",
    author: "Aicha Benjelloun",
    text: "Consultation rapide et efficace. Le médecin est très compétent.",
    rating: 4,
    providerId: "8",
    customerId: "customer11",
    appointmentId: "appointment11",
    createdAt: new Date("2024-02-12"),
    updatedAt: new Date("2024-02-12"),
  },
];

// ============================================================================
// UTILITAIRES MOCK
// ============================================================================

// Fonction pour calculer les statistiques de rating d'un provider
export function getProviderRatingStats(providerId: string): {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
} {
  const reviews = MOCK_REVIEWS.filter(
    review => review.providerId === providerId
  );

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Arrondi à 1 décimale

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
  };
}

// Fonction pour obtenir les avis d'un provider
export function getProviderReviews(providerId: string): IReview[] {
  return MOCK_REVIEWS.filter(review => review.providerId === providerId);
}

export function findUserByEmail(email: string): IUser | undefined {
  return MOCK_USERS.find(user => user.email === email);
}

export function findUserById(id: string): IUser | undefined {
  return MOCK_USERS.find(user => user._id === id);
}

export function findAppointmentById(id: string): IBooking | undefined {
  return MOCK_APPOINTMENTS.find(appointment => appointment._id === id);
}

export function findProviderById(id: string): IUser | undefined {
  return MOCK_USERS.find(
    user =>
      user._id === id &&
      (user.roles.includes("{PROVIDER:INSTITUTION}") ||
        user.roles.includes("{PROVIDER:INDIVIDUAL}"))
  );
}

export function findInvoiceById(id: string): IInvoice | undefined {
  return MOCK_INVOICES.find(invoice => invoice._id === id);
}

export function getAppointmentsByUserId(userId: string): IBooking[] {
  return MOCK_APPOINTMENTS.filter(appointment => appointment.userId === userId);
}

export function getProvidersBySpecialty(specialty: string): IUser[] {
  return MOCK_USERS.filter(
    user =>
      (user.roles.includes("{PROVIDER:INSTITUTION}") ||
        user.roles.includes("{PROVIDER:INDIVIDUAL}")) &&
      user.specialty === specialty
  );
}

export function getUsersByRole(role: string): IUser[] {
  return MOCK_USERS.filter(user => user.roles.includes(role as any));
}
