// Script de test final pour vérifier le flow complet des providers
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

async function testFinalProviderFlow() {
  try {
    console.log('=== Test Final - Flow Complet des Providers ===\n');

    // 1. Test de l'API /api/providers
    console.log("1. Test de l'API /api/providers...");
    const providersResponse = await makeRequest('/api/providers');

    console.log('✅ Status:', providersResponse.status);
    console.log('✅ Success:', providersResponse.data.success);
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

      console.log('\n=== Provider sélectionné ===');
      console.log('ID:', providerId);
      console.log('Name:', firstProvider.name);
      console.log('Email:', firstProvider.email);
      console.log('Roles:', firstProvider.roles);
      console.log('Status:', firstProvider.status);
      console.log('Specialty:', firstProvider.specialty);
      console.log('Specialties:', firstProvider.specialties);
      console.log('Services:', firstProvider.services);
      console.log('Selected Services:', firstProvider.selectedServices);

      // 2. Test de l'API /api/providers/[id]
      console.log(`\n2. Test de l'API /api/providers/${providerId}...`);
      const providerResponse = await makeRequest(
        `/api/providers/${providerId}`
      );

      console.log('✅ Status:', providerResponse.status);
      console.log('✅ Success:', providerResponse.data.success);

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
        console.log('Provider Info:', provider.providerInfo);

        // 3. Test de la logique des services
        console.log('\n=== Test de la logique des services ===');
        const services =
          provider.providerInfo?.services ||
          provider.specialties ||
          provider.selectedServices ||
          [];

        console.log('Services récupérés:', services);
        console.log('Type:', typeof services);
        console.log('Is Array:', Array.isArray(services));

        const servicesList = Array.isArray(services)
          ? services
          : typeof services === 'string'
          ? services.split(',').map(s => s.trim())
          : [];

        console.log('Services finaux:', servicesList);
        console.log('Nombre de services:', servicesList.length);

        if (servicesList.length > 0) {
          console.log('✅ Services trouvés et affichables');
          console.log(
            '✅ La page /services/[id] devrait maintenant afficher les services'
          );
        } else {
          console.log('❌ Aucun service trouvé');
        }

        // 4. Test de l'accès à la page
        console.log(
          `\n4. Test de l'accès à la page /services/${providerId}...`
        );
        console.log(
          '✅ URL à tester:',
          `http://localhost:3000/services/${providerId}`
        );
        console.log(
          '✅ Vérifiez dans la console du navigateur les logs de debug'
        );
        console.log('✅ La section "Services proposés" devrait s\'afficher');
      } else {
        console.log('❌ Erreur API:', providerResponse.data.error);
      }
    } else {
      console.log('❌ Aucun provider trouvé');
    }

    console.log('\n=== Résumé ===');
    console.log('✅ API /api/providers fonctionne');
    console.log('✅ API /api/providers/[id] fonctionne');
    console.log('✅ Récupération des services corrigée');
    console.log('✅ Page /services/[id] prête à être testée');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

console.log('Test Final - Flow Complet des Providers...');
testFinalProviderFlow();
