const mongoose = require('mongoose');

async function checkAndCreateUser() {
  try {
    // Connexion à MongoDB via Mongoose
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney'
    );

    const users = mongoose.connection.db.collection('users');

    const userId = '68f927134ad66acd9f40c445';

    console.log("=== Vérification et création d'utilisateur ===");
    console.log('ID utilisateur:', userId);

    // Vérifier si l'utilisateur existe
    const user = await users.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (user) {
      console.log('✅ Utilisateur trouvé:', user.name || user.email);
      console.log('📋 Informations utilisateur:');
      console.log('   - Email:', user.email);
      console.log('   - Nom:', user.name);
      console.log('   - Rôles:', user.roles);
      console.log('   - Statut:', user.status);

      if (user.availability) {
        console.log('   - Disponibilités: Configurées');
      } else {
        console.log('   - Disponibilités: Non configurées');
      }
    } else {
      console.log('❌ Utilisateur non trouvé');
      console.log("📋 Création d'un utilisateur de test...");

      const testUser = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'test.provider@example.com',
        name: 'Test Provider',
        firstName: 'Test',
        lastName: 'Provider',
        phone: '+33123456789',
        roles: ['PROVIDER'],
        status: 'ACTIVE',
        emailVerified: true,
        specialty: 'Médecine générale',
        providerInfo: {
          type: 'INDIVIDUAL',
          category: 'HEALTH',
          specialties: ['Médecine générale'],
          description: 'Médecin généraliste de test',
          rating: 4.5,
          reviewCount: 0,
          isVerified: true,
          individual: {
            firstName: 'Test',
            lastName: 'Provider',
            qualifications: ['Doctorat en médecine'],
            experience: 5,
            languages: ['Français', 'Anglais'],
          },
          professionalContact: {
            phone: '+33123456789',
            email: 'test.provider@example.com',
          },
          professionalAddress: {
            street: '123 Rue de Test',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
          },
        },
        targetCity: 'Paris',
        countryOfResidence: 'France',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await users.insertOne(testUser);
      if (result.insertedId) {
        console.log('✅ Utilisateur créé avec succès!');
        console.log('📋 Informations utilisateur créé:');
        console.log('   - Email:', testUser.email);
        console.log('   - Nom:', testUser.name);
        console.log('   - Rôles:', testUser.roles);
        console.log('   - Statut:', testUser.status);
      } else {
        console.log("❌ Erreur lors de la création de l'utilisateur");
      }
    }

    // Afficher tous les utilisateurs pour référence
    console.log('\n📋 Liste de tous les utilisateurs:');
    const allUsers = await users.find({}).limit(5).toArray();
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.name || u.email} (${u._id})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkAndCreateUser();
