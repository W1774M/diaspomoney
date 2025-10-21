// Script pour tester la récupération des services des providers
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

async function testProviderServices() {
  try {
    console.log('=== Test de la récupération des services des providers ===\n');

    // 1. Récupérer la liste des providers
    console.log('1. Récupération de la liste des providers...');
    const providersResponse = await makeRequest('/api/providers');

    console.log('Status:', providersResponse.status);
    console.log('Success:', providersResponse.data.success);
    console.log('Total providers:', providersResponse.data.total);
    console.log(
      'Providers count:',
      providersResponse.data.providers?.length || 0
    );

    if (
      providersResponse.data.providers &&
      providersResponse.data.providers.length > 0
    ) {
      const firstProvider = providersResponse.data.providers[0];
      console.log('\n=== Premier provider ===');
      console.log('ID:', firstProvider._id || firstProvider.id);
      console.log('Name:', firstProvider.name);
      console.log('Email:', firstProvider.email);
      console.log('Roles:', firstProvider.roles);
      console.log('Status:', firstProvider.status);
      console.log('Specialty:', firstProvider.specialty);
      console.log('Specialties:', firstProvider.specialties);
      console.log('Services:', firstProvider.services);
      console.log('Selected Services:', firstProvider.selectedServices);
      console.log('Provider Info:', firstProvider.providerInfo);

      // 2. Tester l'API du provider spécifique
      const providerId = firstProvider._id || firstProvider.id;
      console.log(`\n2. Test de l'API /api/providers/${providerId}...`);

      const providerResponse = await makeRequest(
        `/api/providers/${providerId}`
      );

      console.log('Status:', providerResponse.status);
      console.log('Success:', providerResponse.data.success);

      if (providerResponse.data.success && providerResponse.data.data) {
        console.log('\n=== Provider détail - Services ===');
        const provider = providerResponse.data.data;
        console.log('ID:', provider._id || provider.id);
        console.log('Name:', provider.name);
        console.log('Specialty:', provider.specialty);
        console.log('Specialties:', provider.specialties);
        console.log('Services:', provider.services);
        console.log('Selected Services:', provider.selectedServices);
        console.log('Provider Info Services:', provider.providerInfo?.services);
        console.log(
          'Provider Info Specialties:',
          provider.providerInfo?.specialties
        );

        // Vérifier la logique de récupération des services
        console.log('\n=== Analyse des services ===');
        const services =
          provider.providerInfo?.services ||
          provider.specialties ||
          provider.selectedServices ||
          [];
        console.log('Services récupérés:', services);
        console.log('Type:', typeof services);
        console.log('Is Array:', Array.isArray(services));

        if (services && services.length > 0) {
          console.log('✅ Services trouvés pour le provider');
        } else {
          console.log('❌ Aucun service trouvé pour le provider');
        }
      } else {
        console.log('❌ Error:', providerResponse.data.error);
      }
    } else {
      console.log('\n❌ Aucun provider trouvé dans la liste');
    }
  } catch (error) {
    console.error('Erreur lors du test:', error.message);
  }
}

console.log('Test de la récupération des services des providers...');
testProviderServices();
