// Script simple pour tester l'API providers
const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/providers',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('\n=== Réponse API ===');
        console.log('Success:', jsonData.success);
        console.log('Total:', jsonData.total);
        console.log('Providers count:', jsonData.providers?.length || 0);
        console.log('Has results:', jsonData.hasResults);
        
        if (jsonData.providers && jsonData.providers.length > 0) {
          console.log('\n=== Premier provider ===');
          const first = jsonData.providers[0];
          console.log('ID:', first._id || first.id);
          console.log('Name:', first.name);
          console.log('Email:', first.email);
          console.log('Roles:', first.roles);
          console.log('Status:', first.status);
        } else {
          console.log('\n❌ Aucun provider trouvé');
          console.log('Vérifiez que des utilisateurs avec roles: ["PROVIDER"] existent dans la base de données');
        }
      } catch (error) {
        console.error('Erreur parsing JSON:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Erreur requête:', error.message);
    console.log('Assurez-vous que le serveur Next.js est démarré (npm run dev)');
  });

  req.end();
}

console.log('Test de l\'API /api/providers...');
testAPI();
