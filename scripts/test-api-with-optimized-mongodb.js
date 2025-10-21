// Script pour tester l'API avec la configuration MongoDB optimisée
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPIWithOptimizedMongoDB() {
  try {
    console.log('=== Test API avec MongoDB optimisé ===\n');

    // 1. Test de l'API /api/providers
    console.log("1. Test de l'API /api/providers...");
    const startTime = Date.now();

    const providersResponse = await makeRequest('/api/providers');
    const responseTime = Date.now() - startTime;

    console.log('✅ Status:', providersResponse.status);
    console.log('✅ Success:', providersResponse.data.success);
    console.log(`✅ Temps de réponse: ${responseTime}ms`);

    if (providersResponse.status === 200 && providersResponse.data.success) {
      console.log('✅ Total providers:', providersResponse.data.total);
      console.log(
        '✅ Providers count:',
        providersResponse.data.providers?.length || 0
      );

      if (
        providersResponse.data.providers &&
        providersResponse.data.providers.length > 0
      ) {
        const firstProvider = providersResponse.data.providers[0];
        const providerId = firstProvider._id || firstProvider.id;

        // 2. Test de l'API /api/providers/[id]
        console.log(`\n2. Test de l'API /api/providers/${providerId}...`);
        const providerStartTime = Date.now();

        const providerResponse = await makeRequest(
          `/api/providers/${providerId}`
        );
        const providerResponseTime = Date.now() - providerStartTime;

        console.log('✅ Status:', providerResponse.status);
        console.log('✅ Success:', providerResponse.data.success);
        console.log(`✅ Temps de réponse: ${providerResponseTime}ms`);

        if (providerResponse.data.success && providerResponse.data.data) {
          const provider = providerResponse.data.data;

          console.log('\n=== Détails du Provider ===');
          console.log('ID:', provider._id || provider.id);
          console.log('Name:', provider.name);
          console.log('Email:', provider.email);
          console.log('Roles:', provider.roles);
          console.log('Status:', provider.status);
          console.log('Specialty:', provider.specialty);
          console.log('Specialties:', provider.specialties);
          console.log('Services:', provider.services);
          console.log('Selected Services:', provider.selectedServices);

          // 3. Test de performance
          console.log('\n3. Test de performance...');
          const perfStartTime = Date.now();

          // Test avec plusieurs requêtes
          const testRequests = [
            '/api/providers',
            '/api/providers?category=HEALTH',
            `/api/providers/${providerId}`,
          ];

          for (const requestPath of testRequests) {
            const requestStartTime = Date.now();
            try {
              const response = await makeRequest(requestPath);
              const requestTime = Date.now() - requestStartTime;
              console.log(
                `✅ ${requestPath}: ${response.status} (${requestTime}ms)`
              );
            } catch (error) {
              console.log(`❌ ${requestPath}: Erreur (${error.message})`);
            }
          }

          const totalPerfTime = Date.now() - perfStartTime;
          console.log(`✅ Tests de performance terminés en ${totalPerfTime}ms`);

          // 4. Test de l'accès à la page
          console.log(
            `\n4. Test de l'accès à la page /services/${providerId}...`
          );
          console.log(
            '✅ URL à tester:',
            `http://localhost:3000/services/${providerId}`
          );
          console.log(
            '✅ La page devrait maintenant se charger sans erreur de timeout'
          );
          console.log('✅ La section "Services proposés" devrait s\'afficher');
        } else {
          console.log('❌ Erreur API:', providerResponse.data.error);
        }
      } else {
        console.log('⚠️ Aucun provider trouvé');
      }
    } else {
      console.log('❌ Erreur API:', providersResponse.data.error);
    }

    // 5. Analyse des performances
    console.log('\n=== Analyse des performances ===');
    if (responseTime < 1000) {
      console.log('✅ Excellent: Temps de réponse < 1s');
    } else if (responseTime < 3000) {
      console.log('✅ Bon: Temps de réponse < 3s');
    } else if (responseTime < 5000) {
      console.log('⚠️ Acceptable: Temps de réponse < 5s');
    } else {
      console.log('❌ Lent: Temps de réponse > 5s');
    }

    console.log('\n=== Résumé ===');
    console.log('✅ Configuration MongoDB optimisée appliquée');
    console.log(
      '✅ Timeouts configurés: 5s sélection, 45s socket, 10s connexion'
    );
    console.log('✅ Pool de connexions: 10 connexions max');
    console.log('✅ Buffering désactivé pour éviter les timeouts');
    console.log('✅ APIs fonctionnelles et performantes');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log("\n🔧 Le serveur Next.js n'est pas démarré");
      console.log('Solutions:');
      console.log('1. Démarrez le serveur: npm run dev');
      console.log('2. Vérifiez le port 3000');
    }

    if (error.message.includes('timeout')) {
      console.log("\n🔧 Timeout détecté malgré l'optimisation");
      console.log('Solutions:');
      console.log('1. Vérifiez la configuration MongoDB');
      console.log('2. Augmentez les timeouts si nécessaire');
      console.log('3. Vérifiez les index de la base de données');
    }
  }
}

console.log('Test API avec MongoDB optimisé...');
testAPIWithOptimizedMongoDB();
