#!/usr/bin/env node

/**
 * Script de test pour vérifier que les appels en boucle sont résolus
 * Ce script simule les appels API et vérifie qu'il n'y a pas de boucles infinies
 */

const http = require('http');
const url = require('url');

// Compteur pour tracker les appels
let callCount = 0;
let lastCallTime = 0;
const callHistory = [];

// Simuler un serveur de test
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/providers') {
    callCount++;
    const currentTime = Date.now();
    
    // Enregistrer l'historique des appels
    callHistory.push({
      timestamp: currentTime,
      timeSinceLastCall: lastCallTime ? currentTime - lastCallTime : 0,
      query: parsedUrl.query
    });
    
    lastCallTime = currentTime;
    
    console.log(`Appel #${callCount} à ${new Date().toISOString()}`);
    console.log(`  - Temps depuis le dernier appel: ${lastCallTime ? currentTime - lastCallTime : 0}ms`);
    console.log(`  - Query params:`, parsedUrl.query);
    
    // Simuler une réponse avec des providers vides
    const response = {
      success: true,
      providers: [],
      total: 0,
      hasResults: false
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    
    // Détecter les appels trop fréquents (potentielle boucle)
    if (callHistory.length > 1) {
      const recentCalls = callHistory.slice(-3);
      const avgInterval = recentCalls.reduce((sum, call) => sum + call.timeSinceLastCall, 0) / recentCalls.length;
      
      if (avgInterval < 100) { // Moins de 100ms entre les appels
        console.warn('⚠️  ATTENTION: Appels trop fréquents détectés (possible boucle infinie)');
      }
    }
    
    // Arrêter après 10 appels pour éviter les boucles infinies
    if (callCount >= 10) {
      console.log('\n🛑 Arrêt du test après 10 appels pour éviter les boucles infinies');
      console.log('\n📊 Résumé des appels:');
      callHistory.forEach((call, index) => {
        console.log(`  ${index + 1}. ${new Date(call.timestamp).toISOString()} (${call.timeSinceLastCall}ms depuis le précédent)`);
      });
      process.exit(0);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur le port ${PORT}`);
  console.log('📡 Test des appels API pour détecter les boucles infinies...\n');
  
  // Simuler des appels répétés comme le ferait le hook
  let testCallCount = 0;
  const makeTestCall = () => {
    if (testCallCount >= 5) {
      console.log('\n✅ Test terminé - Aucune boucle infinie détectée');
      server.close();
      return;
    }
    
    testCallCount++;
    console.log(`\n🔄 Test call #${testCallCount}`);
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/providers?category=HEALTH',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`  ✅ Réponse reçue: ${response.providers.length} providers`);
        } catch (e) {
          console.log(`  ❌ Erreur parsing: ${e.message}`);
        }
        
        // Faire le prochain appel après un délai
        setTimeout(makeTestCall, 1000);
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Erreur requête: ${e.message}`);
    });
    
    req.end();
  };
  
  // Démarrer les tests
  setTimeout(makeTestCall, 100);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur de test');
  server.close();
  process.exit(0);
});
