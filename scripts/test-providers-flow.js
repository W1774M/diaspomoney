// Script pour tester le flow complet : liste des providers puis détail d'un provider
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

async function testProvidersFlow() {
  try {
    console.log('=== Test du flow complet Providers ===\n');

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

      // 2. Tester l'API du provider spécifique
      const providerId = firstProvider._id || firstProvider.id;
      console.log(`\n2. Test de l'API /api/providers/${providerId}...`);

      const providerResponse = await makeRequest(
        `/api/providers/${providerId}`
      );

      console.log('Status:', providerResponse.status);
      console.log('Success:', providerResponse.data.success);

      if (providerResponse.data.success && providerResponse.data.data) {
        console.log('\n=== Provider détail trouvé ===');
        const provider = providerResponse.data.data;
        console.log('ID:', provider._id || provider.id);
        console.log('Name:', provider.name);
        console.log('Email:', provider.email);
        console.log('Roles:', provider.roles);
        console.log('Status:', provider.status);
        console.log('Specialty:', provider.specialty);
        console.log('Rating:', provider.rating);
        console.log('City:', provider.city);
        console.log('Specialties:', provider.specialties);
        console.log('Services:', provider.services);
        console.log('Provider Info:', provider.providerInfo);
      } else {
        console.log('Error:', providerResponse.data.error);
      }
    } else {
      console.log('\n❌ Aucun provider trouvé dans la liste');
      console.log(
        'Vérifiez que des utilisateurs avec roles: ["PROVIDER"] existent dans la base de données'
      );
    }
  } catch (error) {
    console.error('Erreur lors du test:', error.message);
  }
}

console.log('Test du flow complet Providers...');
testProvidersFlow();
