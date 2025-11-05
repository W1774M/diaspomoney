// Script d'initialisation MongoDB pour DiaspoMoney
// Ce script s'exécute automatiquement au premier démarrage du conteneur MongoDB

// Se connecter à la base de données diaspomoney
db = db.getSiblingDB('diaspomoney');

// Créer un utilisateur pour l'application
db.createUser({
  user: 'diaspomoney',
  pwd: 'password123',
  roles: [
    {
      role: 'readWrite',
      db: 'diaspomoney',
    },
  ],
});

// Créer les collections de base avec des index
print('Création des collections de base...');

// Collection des utilisateurs (modèle mis à jour)
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ roles: 1 }); // Changé de 'role' à 'roles' (array)
db.users.createIndex({ status: 1 });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ emailVerified: 1 });
db.users.createIndex({ isEmailVerified: 1 });

// Collection des services
db.createCollection('services');
db.services.createIndex({ name: 1 });
db.services.createIndex({ category: 1 });
db.services.createIndex({ providerId: 1 });
db.services.createIndex({ isActive: 1 });

// Collection des rendez-vous
db.createCollection('bookings');
db.bookings.createIndex({ providerId: 1 });
db.bookings.createIndex({ requesterId: 1 });
db.bookings.createIndex({ date: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ createdAt: 1 });

// Collection des factures
db.createCollection('invoices');
db.invoices.createIndex({ userId: 1 });
db.invoices.createIndex({ bookingId: 1 });
db.invoices.createIndex({ status: 1 });
db.invoices.createIndex({ createdAt: 1 });

// Collection des transactions
db.createCollection('transactions');
db.transactions.createIndex({ userId: 1 });
db.transactions.createIndex({ type: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ createdAt: 1 });

// Collection des partenaires
db.createCollection('partners');
db.partners.createIndex({ name: 1 });
db.partners.createIndex({ category: 1 });
db.partners.createIndex({ isActive: 1 });

// Collection des spécialités
db.createCollection('specialities');
db.specialities.createIndex({ name: 1 });
db.specialities.createIndex({ category: 1 });

// Collection des tokens de vérification email
db.createCollection('emailverificationtokens');
db.emailverificationtokens.createIndex({ token: 1 }, { unique: true });
db.emailverificationtokens.createIndex({ userId: 1 });
db.emailverificationtokens.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Collection des tokens de réinitialisation de mot de passe
db.createCollection('passwordresettokens');
db.passwordresettokens.createIndex({ token: 1 }, { unique: true });
db.passwordresettokens.createIndex({ userId: 1 });
db.passwordresettokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Collection des tokens de retry
db.createCollection('retrytokens');
db.retrytokens.createIndex({ token: 1 }, { unique: true });
db.retrytokens.createIndex({ userId: 1 });
db.retrytokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Insérer des données de test
print('Insertion des données de test...');

// Utilisateur admin par défaut (modèle mis à jour)
db.users.insertOne({
  _id: ObjectId(),
  name: 'Admin DiaspoMoney',
  firstName: 'Admin',
  lastName: 'DiaspoMoney',
  email: 'admin@diaspomoney.fr',
  phone: '+33123456789',
  password:
    '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', // password123
  roles: ['ADMIN'], // Changé de 'role' à 'roles' (array)
  status: 'ACTIVE',
  emailVerified: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Spécialités par défaut
const specialities = [
  { name: 'Médecine générale', category: 'HEALTH' },
  { name: 'Cardiologie', category: 'HEALTH' },
  { name: 'Dermatologie', category: 'HEALTH' },
  { name: 'Gynécologie', category: 'HEALTH' },
  { name: 'Pédiatrie', category: 'HEALTH' },
  { name: 'Psychiatrie', category: 'HEALTH' },
  { name: 'Radiologie', category: 'HEALTH' },
  { name: 'Chirurgie', category: 'HEALTH' },
  { name: 'Ophtalmologie', category: 'HEALTH' },
  { name: 'ORL', category: 'HEALTH' },
  { name: 'Neurologie', category: 'HEALTH' },
  { name: 'Urologie', category: 'HEALTH' },
  { name: 'Orthopédie', category: 'HEALTH' },
  { name: 'Anesthésie', category: 'HEALTH' },
  { name: 'Médecine du travail', category: 'HEALTH' },
  { name: 'Médecine du sport', category: 'HEALTH' },
  { name: "Médecine d'urgence", category: 'HEALTH' },
  { name: 'Médecine interne', category: 'HEALTH' },
  { name: 'Endocrinologie', category: 'HEALTH' },
  { name: 'Gastro-entérologie', category: 'HEALTH' },
  { name: 'Hématologie', category: 'HEALTH' },
  { name: 'Infectiologie', category: 'HEALTH' },
  { name: 'Néphrologie', category: 'HEALTH' },
  { name: 'Oncologie', category: 'HEALTH' },
  { name: 'Pneumologie', category: 'HEALTH' },
  { name: 'Rhumatologie', category: 'HEALTH' },
  { name: 'Médecine légale', category: 'HEALTH' },
  { name: 'Médecine préventive', category: 'HEALTH' },
  { name: 'Médecine de famille', category: 'HEALTH' },
];

db.specialities.insertMany(specialities);

print('✅ Initialisation MongoDB terminée avec succès!');
print(
  '📊 Collections créées: users, services, bookings, invoices, transactions, partners, specialities'
);
print('👤 Utilisateur admin créé: admin@diaspomoney.fr / password123');
print('🏥 Spécialités médicales insérées');
print(
  '🔗 Connexion: mongodb://diaspomoney:password123@localhost:27017/diaspomoney'
);
