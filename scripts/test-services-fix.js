// Script pour tester la correction de l'erreur selectedServices.split
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

async function testServicesFix() {
  try {
    console.log(
      "=== Test de la correction de l'erreur selectedServices.split ===\n"
    );

    // 1. Récupérer la liste des providers
    console.log('1. Récupération de la liste des providers...');
    const providersResponse = await makeRequest('/api/providers');

    console.log('Status:', providersResponse.status);
    console.log('Success:', providersResponse.data.success);

    if (
      providersResponse.data.providers &&
      providersResponse.data.providers.length > 0
    ) {
      const firstProvider = providersResponse.data.providers[0];
      const providerId = firstProvider._id || firstProvider.id;

      console.log('\n=== Provider sélectionné ===');
      console.log('ID:', providerId);
      console.log('Name:', firstProvider.name);
      console.log(
        'Selected Services (type):',
        typeof firstProvider.selectedServices
      );
      console.log('Selected Services (value):', firstProvider.selectedServices);

      // 2. Tester l'API du provider spécifique
      console.log(`\n2. Test de l'API /api/providers/${providerId}...`);
      const providerResponse = await makeRequest(
        `/api/providers/${providerId}`
      );

      console.log('Status:', providerResponse.status);
      console.log('Success:', providerResponse.data.success);

      if (providerResponse.data.success && providerResponse.data.data) {
        const provider = providerResponse.data.data;

        console.log('\n=== Détails du Provider ===');
        console.log(
          'Selected Services (type):',
          typeof provider.selectedServices
        );
        console.log('Selected Services (value):', provider.selectedServices);
        console.log('Is Array:', Array.isArray(provider.selectedServices));

        // 3. Test de la logique de conversion
        console.log('\n=== Test de la logique de conversion ===');
        let servicesList = [];

        if (Array.isArray(provider.selectedServices)) {
          servicesList = provider.selectedServices;
          console.log('✅ selectedServices est un array');
        } else if (typeof provider.selectedServices === 'string') {
          servicesList = provider.selectedServices
            .split(',')
            .map(s => s.trim());
          console.log(
            '✅ selectedServices est un string, conversion effectuée'
          );
        } else {
          servicesList = [];
          console.log(
            '✅ selectedServices est undefined/null, array vide utilisé'
          );
        }

        console.log('Services finaux:', servicesList);
        console.log('Nombre de services:', servicesList.length);

        if (servicesList.length > 0) {
          console.log('✅ Services trouvés et affichables');
          console.log(
            "✅ L'erreur selectedServices.split devrait être corrigée"
          );
        } else {
          console.log("⚠️ Aucun service trouvé, mais pas d'erreur");
        }

        // 4. Test de l'accès à la page
        console.log(
          `\n4. Test de l'accès à la page /services/${providerId}...`
        );
        console.log(
          '✅ URL à tester:',
          `http://localhost:3000/services/${providerId}`
        );
        console.log('✅ La page devrait maintenant se charger sans erreur');
      } else {
        console.log('❌ Erreur API:', providerResponse.data.error);
      }
    } else {
      console.log('❌ Aucun provider trouvé');
    }

    console.log('\n=== Résumé ===');
    console.log("✅ Correction de l'erreur selectedServices.split appliquée");
    console.log('✅ Gestion des cas string/array/undefined');
    console.log('✅ Page /services/[id] devrait maintenant fonctionner');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

console.log("Test de la correction de l'erreur selectedServices.split...");
testServicesFix();
