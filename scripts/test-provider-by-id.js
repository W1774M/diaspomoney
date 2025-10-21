// Script pour tester l'API /api/providers/[id]
const http = require('http');

function testProviderById(providerId) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/providers/${providerId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  console.log(`Test de l'API /api/providers/${providerId}...`);

  const req = http.request(options, res => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('\n=== Réponse API ===');
        console.log('Success:', jsonData.success);

        if (jsonData.success && jsonData.data) {
          console.log('\n=== Provider trouvé ===');
          const provider = jsonData.data;
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
        } else {
          console.log('Error:', jsonData.error);
        }
      } catch (error) {
        console.error('Erreur parsing JSON:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', error => {
    console.error('Erreur requête:', error.message);
    console.log(
      'Assurez-vous que le serveur Next.js est démarré (npm run dev)'
    );
  });

  req.end();
}

// Test avec un ID de provider (vous devez remplacer par un vrai ID)
const testProviderId = '507f1f77bcf86cd799439011'; // ID d'exemple
console.log("Test de l'API Provider par ID...");
testProviderById(testProviderId);
