// Script pour ajouter des services aux providers existants
const mongoose = require('mongoose');

async function addServicesToProviders() {
  try {
    console.log('=== Ajout de services aux providers ===\n');

    // Connexion à MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney';
    console.log('Connexion à MongoDB:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connexion à MongoDB réussie');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Récupérer tous les providers
    const providers = await usersCollection
      .find({ roles: 'PROVIDER' })
      .toArray();

    console.log('Providers trouvés:', providers.length);

    if (providers.length > 0) {
      for (const provider of providers) {
        console.log(`\n=== Mise à jour du provider: ${provider.name} ===`);

        // Définir les services selon la spécialité
        let services = [];
        let specialties = [];

        if (provider.specialty === 'Médecine générale') {
          services = [
            'Consultation générale',
            'Vaccination',
            'Certificat médical',
            'Prescription',
            'Suivi médical',
          ];
          specialties = ['Médecine générale', 'Urgences', 'Prévention'];
        } else if (provider.specialty === 'Cardiologie') {
          services = [
            'Consultation cardiologique',
            'Échographie cardiaque',
            'Électrocardiogramme',
            'Holter',
            "Test d'effort",
          ];
          specialties = ['Cardiologie', 'Chirurgie cardiaque', 'Rythmologie'];
        } else {
          // Services par défaut
          services = [
            'Consultation',
            'Diagnostic',
            'Traitement',
            'Suivi',
            'Conseil',
          ];
          specialties = [provider.specialty || 'Médecine'];
        }

        // Mettre à jour le provider avec les services
        const updateData = {
          $set: {
            services: services,
            specialties: specialties,
            selectedServices: services,
            'providerInfo.services': services,
            'providerInfo.specialties': specialties,
            updatedAt: new Date(),
          },
        };

        const result = await usersCollection.updateOne(
          { _id: provider._id },
          updateData
        );

        if (result.modifiedCount > 0) {
          console.log('✅ Provider mis à jour avec les services:');
          console.log('  - Services:', services);
          console.log('  - Specialties:', specialties);
        } else {
          console.log('❌ Aucune modification apportée');
        }
      }

      // Vérifier les mises à jour
      console.log('\n=== Vérification des mises à jour ===');
      const updatedProviders = await usersCollection
        .find({ roles: 'PROVIDER' })
        .toArray();

      updatedProviders.forEach((provider, index) => {
        console.log(`Provider ${index + 1}:`, {
          name: provider.name,
          specialty: provider.specialty,
          services: provider.services,
          specialties: provider.specialties,
          selectedServices: provider.selectedServices,
          providerInfoServices: provider.providerInfo?.services,
        });
      });
    } else {
      console.log('❌ Aucun provider trouvé');
    }

    await mongoose.disconnect();
    console.log('\n✅ Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addServicesToProviders();
