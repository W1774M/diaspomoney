const fetch = require('node-fetch');

async function testProvidersAPI() {
  try {
    console.log("=== Test de l'API Providers ===");

    // Test de l'API providers
    const response = await fetch('http://localhost:3000/api/providers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erreur HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Erreur détail:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Réponse API:', {
      success: data.success,
      total: data.total,
      providersCount: data.providers?.length || 0,
      hasResults: data.hasResults,
    });

    if (data.providers && data.providers.length > 0) {
      console.log('\n=== Premier provider ===');
      const firstProvider = data.providers[0];
      console.log({
        id: firstProvider._id,
        name: firstProvider.name,
        email: firstProvider.email,
        roles: firstProvider.roles,
        status: firstProvider.status,
        specialty: firstProvider.specialty,
        rating: firstProvider.rating,
      });
    } else {
      console.log('Aucun provider trouvé');
    }
  } catch (error) {
    console.error('Erreur lors du test:', error.message);
  }
}

// Attendre un peu que le serveur démarre
setTimeout(() => {
  testProvidersAPI();
}, 3000);
