// Script simple pour tester MongoDB sans authentification
const mongoose = require('mongoose');

async function testMongoDBSimple() {
  try {
    console.log('=== Test Simple MongoDB ===\n');

    // Configuration simple
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney';
    console.log('URI MongoDB:', mongoUri);

    const options = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
    };

    console.log('Options:', options);

    // Test de connexion
    console.log('\n1. Connexion...');
    const startTime = Date.now();

    await mongoose.connect(mongoUri, options);
    const connectionTime = Date.now() - startTime;

    console.log(`✅ Connexion réussie en ${connectionTime}ms`);

    // Test simple
    console.log('\n2. Test simple...');
    const db = mongoose.connection.db;
    console.log('Base de données:', db.databaseName);

    // Lister les collections
    console.log('\n3. Collections disponibles...');
    const collections = await db.listCollections().toArray();
    console.log(
      'Collections:',
      collections.map(c => c.name)
    );

    // Test de ping
    console.log('\n4. Test de ping...');
    const pingStartTime = Date.now();
    await db.admin().ping();
    const pingTime = Date.now() - pingStartTime;
    console.log(`✅ Ping réussi en ${pingTime}ms`);

    // Test de stats
    console.log('\n5. Statistiques de la base...');
    try {
      const stats = await db.stats();
      console.log(
        'Taille de la base:',
        Math.round(stats.dataSize / 1024),
        'KB'
      );
      console.log('Collections:', stats.collections);
    } catch (error) {
      console.log('⚠️ Impossible de récupérer les stats:', error.message);
    }

    console.log('\n✅ Test simple terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error.message);

    if (error.message.includes('authentication')) {
      console.log("\n🔧 Problème d'authentification détecté");
      console.log('Solutions possibles:');
      console.log('1. Vérifiez les credentials MongoDB');
      console.log("2. Vérifiez la configuration d'authentification");
      console.log('3. Testez sans authentification en local');
    }

    if (error.message.includes('ECONNREFUSED')) {
      console.log("\n🔧 MongoDB n'est pas démarré");
      console.log('Solutions:');
      console.log('1. Démarrez MongoDB: mongod');
      console.log('2. Vérifiez le port 27017');
    }
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\n✅ Connexion fermée');
    } catch (error) {
      console.error('❌ Erreur fermeture:', error.message);
    }
  }
}

testMongoDBSimple();
