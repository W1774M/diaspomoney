const mongoose = require('mongoose');

async function createTestProviders() {
  try {
    // Utiliser la connexion MongoDB directe
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney'
    );

    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    console.log('=== Création des providers de test ===');

    // Vérifier s'il y a déjà des providers
    const existingProviders = await users.find({ roles: 'PROVIDER' }).toArray();
    console.log('Providers existants:', existingProviders.length);

    if (existingProviders.length === 0) {
      // Créer des providers de test
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
        {
          email: 'institut.sante@example.com',
          name: 'Institut Santé Plus',
          firstName: 'Institut',
          lastName: 'Santé Plus',
          phone: '+33111111111',
          roles: ['PROVIDER'],
          status: 'ACTIVE',
          emailVerified: true,
          specialty: 'Médecine générale',
          providerInfo: {
            type: 'INSTITUTION',
            category: 'HEALTH',
            specialties: ['Médecine générale', 'Urgences', 'Radiologie'],
            description: 'Institut médical multidisciplinaire',
            rating: 4.7,
            reviewCount: 128,
            isVerified: true,
            institution: {
              legalName: 'Institut Santé Plus',
              registrationNumber: '123456789',
              establishedYear: 2015,
              employees: 25,
              certifications: ['ISO 9001', 'Certification médicale'],
            },
            professionalContact: {
              phone: '+33111111111',
              email: 'contact@institut-sante.com',
              website: 'https://institut-sante.com',
            },
            professionalAddress: {
              street: '25 Boulevard de la Santé',
              city: 'Marseille',
              postalCode: '13000',
              country: 'France',
            },
          },
          targetCity: 'Marseille',
          countryOfResidence: 'France',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await users.insertMany(testProviders);
      console.log('Providers créés:', result.insertedIds.length);

      // Vérifier la création
      const newProviders = await users.find({ roles: 'PROVIDER' }).toArray();
      console.log('Total providers après création:', newProviders.length);
    } else {
      console.log('Des providers existent déjà, pas de création nécessaire');
    }

    await client.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createTestProviders();
