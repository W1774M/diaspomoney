#!/usr/bin/env node

/**
 * Script de diagnostic MongoDB pour résoudre les problèmes de connexion en production
 * Basé sur la charte de développement DiaspoMoney
 */

const { execSync } = require('child_process');
const mongoose = require('mongoose');

console.log('🔍 DIAGNOSTIC MONGODB - DiaspoMoney Production');
console.log('===============================================\n');

// Configuration des tests
const tests = [
  {
    name: '1. Vérification DNS depuis le container',
    command: 'docker exec app nslookup mongo.diaspomoney.fr',
    description: 'Test de résolution DNS interne'
  },
  {
    name: '2. Test de connectivité TCP',
    command: 'docker exec app nc -zv mongo.diaspomoney.fr 27017',
    description: 'Vérification de la connectivité réseau'
  },
  {
    name: '3. Variables d\'environnement MongoDB',
    command: 'docker exec app env | grep MONGO',
    description: 'Inspection des variables d\'environnement'
  },
  {
    name: '4. Test de connexion avec mongosh',
    command: 'docker exec app mongosh "mongodb://admin:admin123@mongo.diaspomoney.fr:27017/diaspomoney?authSource=admin" --eval "db.runCommand({ping: 1})"',
    description: 'Test de connexion directe MongoDB'
  }
];

// Fonction pour exécuter un test
async function runTest(test) {
  console.log(`\n📋 ${test.name}`);
  console.log(`   ${test.description}`);
  console.log('   Commande:', test.command);
  
  try {
    const output = execSync(test.command, { 
      encoding: 'utf8',
      timeout: 10000,
      stdio: 'pipe'
    });
    console.log('   ✅ SUCCESS');
    console.log('   Output:', output.trim());
  } catch (error) {
    console.log('   ❌ FAILED');
    console.log('   Error:', error.message);
  }
}

// Fonction pour tester la connexion Node.js
async function testNodeConnection() {
  console.log('\n📋 5. Test de connexion Node.js/Mongoose');
  console.log('   Test de connexion avec la configuration actuelle');
  
  const testUri = process.env.MONGODB_URI || 
    'mongodb://admin:admin123@mongo.diaspomoney.fr:27017/diaspomoney?authSource=admin';
  
  try {
    await mongoose.connect(testUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('   ✅ SUCCESS - Connexion Node.js établie');
    console.log('   Host:', mongoose.connection.host);
    console.log('   Database:', mongoose.connection.name);
    
    // Test de ping
    await mongoose.connection.db.admin().ping();
    console.log('   ✅ PING SUCCESS - MongoDB répond');
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('   ❌ FAILED - Connexion Node.js échouée');
    console.log('   Error:', error.message);
    
    // Suggestions de résolution
    console.log('\n💡 SUGGESTIONS DE RÉSOLUTION:');
    console.log('   1. Vérifier que le service MongoDB est démarré');
    console.log('   2. Vérifier les credentials dans .env');
    console.log('   3. Utiliser le nom de service Docker interne (mongodb au lieu de mongo.diaspomoney.fr)');
    console.log('   4. Vérifier la configuration réseau Docker');
  }
}

// Fonction pour proposer des solutions
function proposeSolutions() {
  console.log('\n🔧 SOLUTIONS RECOMMANDÉES:');
  console.log('==========================');
  
  console.log('\n📌 Solution A - DNS Interne (Recommandé)');
  console.log('   Modifier docker-compose.prod.yml:');
  console.log('   environment:');
  console.log('     MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin');
  console.log('   networks:');
  console.log('     - diaspomoney  # Même réseau que MongoDB');
  
  console.log('\n📌 Solution B - Connection String Complète');
  console.log('   .env.production:');
  console.log('   MONGODB_URI=mongodb://admin:password@mongodb:27017/diaspomoney?authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=5000');
  
  console.log('\n📌 Solution C - MongoDB Atlas (Recommandé pour Scale)');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/diaspomoney?retryWrites=true&w=majority');
}

// Exécution des tests
async function main() {
  try {
    // Tests Docker
    for (const test of tests) {
      await runTest(test);
    }
    
    // Test Node.js
    await testNodeConnection();
    
    // Proposer des solutions
    proposeSolutions();
    
    console.log('\n✅ Diagnostic terminé');
    console.log('📊 Consultez les logs ci-dessus pour identifier le problème');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = { main, runTest, testNodeConnection };
