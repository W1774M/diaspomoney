// Script pour vérifier la connexion à la base de données et créer des providers de test
const mongoose = require('mongoose');

async function verifyDatabaseConnection() {
  try {
    console.log('=== Vérification de la connexion à la base de données ===\n');

    // Connexion à MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney';
    console.log('Connexion à MongoDB:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connexion à MongoDB réussie');

    // Vérifier la collection users
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n=== Vérification de la collection users ===');
    const totalUsers = await usersCollection.countDocuments();
    console.log('Total utilisateurs:', totalUsers);

    // Vérifier les providers
    const providers = await usersCollection
      .find({ roles: 'PROVIDER' })
      .toArray();
    console.log('Providers trouvés:', providers.length);

    if (providers.length === 0) {
      console.log('\n=== Création de providers de test ===');

      const testProviders = [
        {
          email: 'dr.martin@example.com',
          name: 'Dr. Marie Martin',
          firstName: 'Marie',
          lastName: 'Martin',
          phone: '+33123456789',
          roles: ['PROVIDER'],
          status: 'ACTIVE',
          emailVerified: true,
          specialty: 'Médecine générale',
          providerInfo: {
            type: 'INDIVIDUAL',
            category: 'HEALTH',
            specialties: ['Médecine générale', 'Urgences'],
            description: "Médecin généraliste avec 10 ans d'expérience",
            rating: 4.8,
            reviewCount: 45,
            isVerified: true,
            individual: {
              firstName: 'Marie',
              lastName: 'Martin',
              qualifications: ['Doctorat en médecine'],
              experience: 10,
              languages: ['Français', 'Anglais'],
            },
            professionalContact: {
              phone: '+33123456789',
              email: 'dr.martin@example.com',
            },
            professionalAddress: {
              street: '15 Rue de la Santé',
              city: 'Paris',
              postalCode: '75012',
              country: 'France',
            },
          },
          targetCity: 'Paris',
          countryOfResidence: 'France',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          email: 'prof.dubois@example.com',
          name: 'Prof. Jean Dubois',
          firstName: 'Jean',
          lastName: 'Dubois',
          phone: '+33987654321',
          roles: ['PROVIDER'],
          status: 'ACTIVE',
          emailVerified: true,
          specialty: 'Cardiologie',
          providerInfo: {
            type: 'INDIVIDUAL',
            category: 'HEALTH',
            specialties: ['Cardiologie', 'Chirurgie cardiaque'],
            description: 'Cardiologue spécialisé en chirurgie cardiaque',
            rating: 4.9,
            reviewCount: 32,
            isVerified: true,
            individual: {
              firstName: 'Jean',
              lastName: 'Dubois',
              qualifications: [
                'Doctorat en médecine',
                'Spécialisation cardiologie',
              ],
              experience: 15,
              languages: ['Français', 'Anglais', 'Espagnol'],
            },
            professionalContact: {
              phone: '+33987654321',
              email: 'prof.dubois@example.com',
            },
            professionalAddress: {
              street: '8 Avenue des Spécialistes',
              city: 'Lyon',
              postalCode: '69000',
              country: 'France',
            },
          },
          targetCity: 'Lyon',
          countryOfResidence: 'France',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await usersCollection.insertMany(testProviders);
      console.log('✅ Providers créés:', result.insertedIds.length);

      // Vérifier la création
      const newProviders = await usersCollection
        .find({ roles: 'PROVIDER' })
        .toArray();
      console.log('Total providers après création:', newProviders.length);

      // Afficher les IDs pour les tests
      console.log('\n=== IDs des providers créés ===');
      newProviders.forEach((provider, index) => {
        console.log(`Provider ${index + 1}:`, {
          id: provider._id.toString(),
          name: provider.name,
          email: provider.email,
          roles: provider.roles,
          status: provider.status,
        });
      });
    } else {
      console.log('\n=== Providers existants ===');
      providers.forEach((provider, index) => {
        console.log(`Provider ${index + 1}:`, {
          id: provider._id.toString(),
          name: provider.name,
          email: provider.email,
          roles: provider.roles,
          status: provider.status,
        });
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Impossible de se connecter à MongoDB');
      console.log('Vérifiez que MongoDB est démarré et accessible');
    }
  }
}

verifyDatabaseConnection();
