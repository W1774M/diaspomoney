// Script d'initialisation MongoDB pour DiaspoMoney
// Ce script s'exécute automatiquement au premier démarrage du conteneur

print("=== Initialisation de la base de données DiaspoMoney ===");

// Attendre que MongoDB soit prêt
print("Attente que MongoDB soit prêt...");
while (!db.adminCommand("ping").ok) {
  print("MongoDB pas encore prêt, attente...");
  sleep(1000);
}
print("MongoDB est prêt !");

// Créer la base de données diaspomoney
db = db.getSiblingDB("diaspomoney");
print("Base de données diaspomoney créée/sélectionnée");

// Créer un utilisateur pour l'application
db.createUser({
  user: "diaspomoney_user",
  pwd: "diaspomoney_pass",
  roles: [
    { role: "readWrite", db: "diaspomoney" },
    { role: "dbAdmin", db: "diaspomoney" },
  ],
});
print("Utilisateur diaspomoney_user créé");

// Création des collections principales selon les models du dossier models/
db.createCollection("users");
db.createCollection("appointments");
db.createCollection("providers");
db.createCollection("invoices");
db.createCollection("specialities");
db.createCollection("emailverificationtokens");
db.createCollection("passwordresettokens");
db.createCollection("retrytokens");
db.createCollection("transactions");
db.createCollection("wallets");
db.createCollection("notifications");
db.createCollection("kycfiles");
print("Collections principales créées");

// Index pour le model User (models/User.ts)
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ name: 1 });
db.users.createIndex({ roles: 1 });
db.users.createIndex({ status: 1 });

// Index pour appointments (models/Appointment.ts)
db.appointments.createIndex({ userId: 1 });
db.appointments.createIndex({ providerId: 1 });
db.appointments.createIndex({ date: 1 });

// Index pour providers (models/Provider.ts)
db.providers.createIndex({ email: 1 }, { unique: true });
db.providers.createIndex({ specialityId: 1 });
db.providers.createIndex({ name: 1 });

// Index pour invoices (models/Invoice.ts)
db.invoices.createIndex({ userId: 1 });
db.invoices.createIndex({ appointmentId: 1 });
db.invoices.createIndex({ providerId: 1 });

// Index pour specialities (models/Speciality.ts)
db.specialities.createIndex({ name: 1 }, { unique: true });

// Index pour emailverificationtokens (models/EmailVerificationToken.ts)
db.emailverificationtokens.createIndex({ userId: 1 });
db.emailverificationtokens.createIndex({ token: 1 }, { unique: true });

// Index pour passwordresettokens (models/PasswordResetToken.ts)
db.passwordresettokens.createIndex({ userId: 1 });
db.passwordresettokens.createIndex({ token: 1 }, { unique: true });

// Index pour retrytokens (models/RetryToken.ts)
db.retrytokens.createIndex({ userId: 1 });
db.retrytokens.createIndex({ token: 1 }, { unique: true });

// Index pour transactions (models/Transaction.ts)
db.transactions.createIndex({ userId: 1 });
db.transactions.createIndex({ walletId: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ type: 1 });

// Index pour wallets (models/Wallet.ts)
db.wallets.createIndex({ userId: 1 });
db.wallets.createIndex({ currency: 1 });

// Index pour notifications (models/Notification.ts)
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ read: 1 });

// Index pour kycfiles (models/KycFile.ts)
db.kycfiles.createIndex({ userId: 1 });
db.kycfiles.createIndex({ status: 1 });

print("Index créés");

// Insérer des données de test (optionnel)
if (db.users.countDocuments() === 0) {
  print("Insertion de données de test...");

  // Utilisateur de test conforme au model User.ts
  db.users.insertOne({
    email: "test@example.com",
    name: "Test User",
    phone: "+1234567890",
    company: "Test Company",
    address: "123 Test Street",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
    specialty: null,
    recommended: false,
    apiGeo: [],
    password: "$2a$10$testhash", // Mot de passe hashé fictif
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Spécialité de test (models/Speciality.ts)
  db.specialities.insertOne({
    name: "Médecine Générale",
    description: "Consultation de médecine générale",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Wallet de test (models/Wallet.ts)
  db.wallets.insertOne({
    userId: db.users.findOne({ email: "test@example.com" })._id,
    balance: 0,
    currency: "EUR",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  print("Données de test insérées");
}

print("=== Initialisation terminée avec succès ===");
print("Base de données: diaspomoney");
print("Utilisateur admin: admin/admin123");
print("Utilisateur app: diaspomoney_user/diaspomoney_pass");
print("Interface web: http://localhost:8081");
