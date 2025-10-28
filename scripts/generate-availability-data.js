// Script pour générer les données de disponibilité pour l'utilisateur 68f927134ad66acd9f40c445

console.log('=== Génération des données de disponibilité ===');
console.log('ID utilisateur: 68f927134ad66acd9f40c445');
console.log('');

// Définir les disponibilités pour chaque jour de la semaine
const availabilityData = {
  monday: [
    {
      start: '09:00',
      end: '12:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
    {
      start: '14:00',
      end: '18:00',
      isAvailable: true,
      maxBookings: 4,
      currentBookings: 0,
    },
  ],
  tuesday: [
    {
      start: '09:00',
      end: '12:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
    {
      start: '14:00',
      end: '18:00',
      isAvailable: true,
      maxBookings: 4,
      currentBookings: 0,
    },
  ],
  wednesday: [
    {
      start: '09:00',
      end: '12:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
    {
      start: '14:00',
      end: '18:00',
      isAvailable: true,
      maxBookings: 4,
      currentBookings: 0,
    },
  ],
  thursday: [
    {
      start: '09:00',
      end: '12:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
    {
      start: '14:00',
      end: '18:00',
      isAvailable: true,
      maxBookings: 4,
      currentBookings: 0,
    },
  ],
  friday: [
    {
      start: '09:00',
      end: '12:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
    {
      start: '14:00',
      end: '17:00',
      isAvailable: true,
      maxBookings: 3,
      currentBookings: 0,
    },
  ],
  saturday: [
    {
      start: '10:00',
      end: '14:00',
      isAvailable: true,
      maxBookings: 2,
      currentBookings: 0,
    },
  ],
  sunday: [], // Pas de disponibilité le dimanche
  timezone: 'Europe/Paris',
};

console.log('✅ Données de disponibilité générées:');
console.log('📅 Horaires configurés:');
console.log('   - Lundi à Vendredi: 9h-12h et 14h-18h (sauf Vendredi 14h-17h)');
console.log('   - Samedi: 10h-14h');
console.log('   - Dimanche: Pas de disponibilité');
console.log('   - Fuseau horaire: Europe/Paris');

console.log('\n📋 Détail des créneaux:');
Object.keys(availabilityData).forEach(day => {
  if (day !== 'timezone' && availabilityData[day].length > 0) {
    console.log(`   ${day}: ${availabilityData[day].length} créneau(x)`);
    availabilityData[day].forEach(slot => {
      console.log(
        `     - ${slot.start} à ${slot.end} (max: ${slot.maxBookings})`
      );
    });
  }
});
console.log(`   Fuseau horaire: ${availabilityData.timezone}`);

console.log('\n🔧 Commande MongoDB pour ajouter ces disponibilités:');
console.log('db.users.updateOne(');
console.log('  { _id: ObjectId("68f927134ad66acd9f40c445") },');
console.log(
  `  { $set: { availability: ${JSON.stringify(availabilityData, null, 2)} } }`
);
console.log(');');

console.log('\n📝 Structure JSON complète:');
console.log(JSON.stringify(availabilityData, null, 2));

console.log('\n💡 Instructions:');
console.log('1. Connectez-vous à MongoDB avec authentification');
console.log('2. Utilisez la commande MongoDB ci-dessus');
console.log("3. Ou utilisez l'interface d'administration de l'application");
console.log(
  '4. Ou créez un endpoint API pour mettre à jour les disponibilités'
);
