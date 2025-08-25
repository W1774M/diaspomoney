// Script d'initialisation MongoDB pour DiaspoMoney
// Ce script s'exécute automatiquement lors du premier démarrage du conteneur MongoDB

// Sélectionner la base de données
db = db.getSiblingDB("diaspomoney");

// Créer un utilisateur pour l'application
db.createUser({
  user: "diaspomoney_user",
  pwd: "diaspomoney_app_password",
  roles: [
    {
      role: "readWrite",
      db: "diaspomoney",
    },
  ],
});

// Créer les collections avec des données de base

// Collection des prestataires
db.createCollection("providers");
db.providers.insertMany([
  {
    id: 1,
    name: "Cabinet Médical Dr. Martin",
    type: { id: "medical", value: "Médecine générale" },
    specialty: "Médecine générale et consultations",
    description:
      "Cabinet médical moderne offrant des soins de qualité pour toute la famille. Consultations sur rendez-vous avec des médecins expérimentés.",
    services: [
      { id: 1, name: "Consultation générale", price: 25 },
      { id: 2, name: "Certificat médical", price: 15 },
      { id: 3, name: "Vaccination", price: 20 },
    ],
    apiGeo: [
      {
        display_name: "123 Rue de la Paix, 75001 Paris, France",
        lat: "48.8566",
        lon: "2.3522",
      },
    ],
    images: [
      "/img/providers/cabinet-medical-1.jpg",
      "/img/providers/cabinet-medical-2.jpg",
    ],
    rating: 4.5,
    reviews: 127,
    distance: "2.3 km",
    recommended: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Institut de Beauté Élégance",
    type: { id: "beauty", value: "Beauté & Bien-être" },
    specialty: "Soins esthétiques et beauté",
    description:
      "Institut de beauté haut de gamme proposant des soins personnalisés et des traitements innovants pour votre bien-être.",
    services: [
      { id: 1, name: "Soin du visage", price: 45 },
      { id: 2, name: "Manucure", price: 25 },
      { id: 3, name: "Massage relaxant", price: 60 },
    ],
    apiGeo: [
      {
        display_name: "456 Avenue des Champs, 75008 Paris, France",
        lat: "48.8698",
        lon: "2.3077",
      },
    ],
    images: ["/img/providers/beaute-1.jpg", "/img/providers/beaute-2.jpg"],
    rating: 4.8,
    reviews: 89,
    distance: "1.7 km",
    recommended: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: "Restaurant Le Gourmet",
    type: { id: "restaurant", value: "Restauration" },
    specialty: "Cuisine française traditionnelle",
    description:
      "Restaurant gastronomique proposant une cuisine française raffinée dans un cadre élégant et chaleureux.",
    services: [
      { id: 1, name: "Menu dégustation", price: 85 },
      { id: 2, name: "Réservation table", price: 0 },
      { id: 3, name: "Traiteur événements", price: 150 },
    ],
    apiGeo: [
      {
        display_name: "789 Boulevard Saint-Germain, 75006 Paris, France",
        lat: "48.8534",
        lon: "2.3488",
      },
    ],
    images: [
      "/img/providers/restaurant-1.jpg",
      "/img/providers/restaurant-2.jpg",
    ],
    rating: 4.6,
    reviews: 203,
    distance: "3.1 km",
    recommended: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Collection des réservations
db.createCollection("appointments");
db.appointments.createIndex({ "requester.email": 1 });
db.appointments.createIndex({ "provider.id": 1 });
db.appointments.createIndex({ timeslot: 1 });
db.appointments.createIndex({ status: 1 });

// Collection des utilisateurs
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });
db.users.insertMany([
  {
    email: "admin@diaspomoney.fr",
    password: "$2b$10$hashed_password_here", // À remplacer par un vrai hash
    firstName: "Admin",
    lastName: "DiaspoMoney",
    role: "admin",
    phone: "+33123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Collection des paiements
db.createCollection("payments");
db.payments.createIndex({ appointmentId: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: 1 });

// Collection des tokens de retry
db.createCollection("retry_tokens");
db.retry_tokens.createIndex({ token: 1 }, { unique: true });
db.retry_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Collection des logs d'emails
db.createCollection("email_logs");
db.email_logs.createIndex({ recipient: 1 });
db.email_logs.createIndex({ type: 1 });
db.email_logs.createIndex({ createdAt: 1 });

// Collection des erreurs de paiement
db.createCollection("payment_errors");
db.payment_errors.createIndex({ appointmentId: 1 });
db.payment_errors.createIndex({ errorType: 1 });
db.payment_errors.createIndex({ createdAt: 1 });

// Collection des statistiques
db.createCollection("statistics");
db.statistics.insertOne({
  type: "global",
  totalAppointments: 0,
  totalRevenue: 0,
  totalProviders: 3,
  totalUsers: 1,
  lastUpdated: new Date(),
});

print("✅ Base de données DiaspoMoney initialisée avec succès !");
print(
  "📊 Collections créées : providers, appointments, users, payments, retry_tokens, email_logs, payment_errors, statistics"
);
print("👤 Utilisateur admin créé : admin@diaspomoney.fr");
print("🏥 3 prestataires de démonstration ajoutés");
print(
  "🔗 Connexion MongoDB : mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney"
);
