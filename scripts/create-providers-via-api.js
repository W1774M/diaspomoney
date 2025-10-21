// Script pour créer des providers via l'API POST /api/providers
const http = require('http');

function createProvider(providerData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(providerData);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/providers',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
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
    req.write(postData);
    req.end();
  });
}

async function createTestProviders() {
  try {
    console.log('=== Création de providers via API ===\n');

    const testProviders = [
      {
        userId: 'test-user-1',
        specialities: ['Médecine générale', 'Urgences'],
        type: 'INDIVIDUAL',
        category: 'HEALTH',
        description: "Médecin généraliste avec 10 ans d'expérience",
        rating: 4.8,
        reviewCount: 45,
        isVerified: true,
        individual: {
          firstName: 'Marie',
          lastName: 'Martin',
          qualifications: ['Doctorat en médecine'],
          experience: 10,
          languages: ['Français', 'Anglais'],
        },
        professionalContact: {
          phone: '+33123456789',
          email: 'dr.martin@example.com',
        },
        professionalAddress: {
          street: '15 Rue de la Santé',
          city: 'Paris',
          postalCode: '75012',
          country: 'France',
        },
      },
      {
        userId: 'test-user-2',
        specialities: ['Cardiologie', 'Chirurgie cardiaque'],
        type: 'INDIVIDUAL',
        category: 'HEALTH',
        description: 'Cardiologue spécialisé en chirurgie cardiaque',
        rating: 4.9,
        reviewCount: 32,
        isVerified: true,
        individual: {
          firstName: 'Jean',
          lastName: 'Dubois',
          qualifications: [
            'Doctorat en médecine',
            'Spécialisation cardiologie',
          ],
          experience: 15,
          languages: ['Français', 'Anglais', 'Espagnol'],
        },
        professionalContact: {
          phone: '+33987654321',
          email: 'prof.dubois@example.com',
        },
        professionalAddress: {
          street: '8 Avenue des Spécialistes',
          city: 'Lyon',
          postalCode: '69000',
          country: 'France',
        },
      },
    ];

    for (let i = 0; i < testProviders.length; i++) {
      const provider = testProviders[i];
      console.log(`Création du provider ${i + 1}...`);

      try {
        const response = await createProvider(provider);
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);

        if (response.data.success) {
          console.log('Provider créé:', response.data.provider.id);
        } else {
          console.log('Erreur:', response.data.error);
        }
      } catch (error) {
        console.error('Erreur lors de la création:', error.message);
      }

      console.log('---');
    }
  } catch (error) {
    console.error('Erreur générale:', error.message);
  }
}

console.log('Création de providers via API...');
createTestProviders();
