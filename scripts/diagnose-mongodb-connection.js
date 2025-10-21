// Script de diagnostic pour tester la connexion MongoDB et identifier les problèmes de timeout
const mongoose = require('mongoose');

async function diagnoseMongoDBConnection() {
  try {
    console.log('=== Diagnostic de la connexion MongoDB ===\n');

    // Configuration optimisée
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney';
    console.log('URI MongoDB:', mongoUri);

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
    };

    console.log('Options de connexion:', options);

    // Test de connexion
    console.log('\n1. Test de connexion...');
    const startTime = Date.now();

    await mongoose.connect(mongoUri, options);
    const connectionTime = Date.now() - startTime;

    console.log(`✅ Connexion réussie en ${connectionTime}ms`);

    // Test de la base de données
    console.log('\n2. Test de la base de données...');
    const db = mongoose.connection.db;
    console.log('Nom de la base:', db.databaseName);

    // Test de la collection users
    console.log('\n3. Test de la collection users...');
    const usersCollection = db.collection('users');

    const countStartTime = Date.now();
    const totalUsers = await usersCollection.countDocuments();
    const countTime = Date.now() - countStartTime;

    console.log(`✅ Total utilisateurs: ${totalUsers} (${countTime}ms)`);

    // Test des providers
    console.log('\n4. Test des providers...');
    const providersStartTime = Date.now();
    const providers = await usersCollection
      .find({ roles: 'PROVIDER' })
      .limit(5)
      .toArray();
    const providersTime = Date.now() - providersStartTime;

    console.log(
      `✅ Providers trouvés: ${providers.length} (${providersTime}ms)`
    );

    if (providers.length > 0) {
      console.log('\n=== Détails des providers ===');
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

    // Test de performance
    console.log('\n5. Test de performance...');
    const perfStartTime = Date.now();

    // Test avec différents filtres
    const testQueries = [
      { roles: 'PROVIDER' },
      { status: 'ACTIVE' },
      { roles: 'PROVIDER', status: 'ACTIVE' },
    ];

    for (const query of testQueries) {
      const queryStartTime = Date.now();
      const result = await usersCollection.find(query).limit(10).toArray();
      const queryTime = Date.now() - queryStartTime;

      console.log(
        `Query ${JSON.stringify(query)}: ${
          result.length
        } résultats (${queryTime}ms)`
      );
    }

    const totalPerfTime = Date.now() - perfStartTime;
    console.log(`✅ Tests de performance terminés en ${totalPerfTime}ms`);

    // Test de la connexion Mongoose
    console.log('\n6. Test de la connexion Mongoose...');
    const mongooseStartTime = Date.now();

    // Simuler une requête comme dans le service
    const User = mongoose.model(
      'User',
      new mongoose.Schema({}, { strict: false })
    );
    const mongooseUsers = await User.find({ roles: 'PROVIDER' })
      .limit(5)
      .exec();
    const mongooseTime = Date.now() - mongooseStartTime;

    console.log(
      `✅ Requête Mongoose: ${mongooseUsers.length} résultats (${mongooseTime}ms)`
    );

    // Recommandations
    console.log('\n=== Recommandations ===');
    if (connectionTime > 5000) {
      console.log('⚠️ Connexion lente (>5s) - Vérifiez la latence réseau');
    }
    if (countTime > 2000) {
      console.log("⚠️ Comptage lent (>2s) - Considérez l'indexation");
    }
    if (providersTime > 3000) {
      console.log('⚠️ Requête providers lente (>3s) - Optimisez les index');
    }
    if (totalPerfTime > 10000) {
      console.log(
        '⚠️ Performance générale lente (>10s) - Vérifiez la configuration'
      );
    }

    console.log('\n✅ Diagnostic terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);

    if (error.message.includes('timeout')) {
      console.log('\n🔧 Solutions pour les timeouts:');
      console.log('1. Vérifiez que MongoDB est démarré');
      console.log('2. Vérifiez la connectivité réseau');
      console.log('3. Augmentez les timeouts dans la configuration');
      console.log('4. Vérifiez les index de la base de données');
    }

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Solutions pour ECONNREFUSED:');
      console.log('1. Démarrez MongoDB: mongod');
      console.log('2. Vérifiez le port (27017 par défaut)');
      console.log('3. Vérifiez les permissions');
    }
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\n✅ Connexion fermée');
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture:', error.message);
    }
  }
}

diagnoseMongoDBConnection();
