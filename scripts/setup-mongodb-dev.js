// Script pour configurer MongoDB en mode développement sans authentification
const { exec } = require('child_process');
const path = require('path');

async function setupMongoDBDev() {
  try {
    console.log('=== Configuration MongoDB pour le développement ===\n');

    console.log(
      "🔧 Solutions pour résoudre les problèmes d'authentification:\n"
    );

    console.log('1. DÉMARRER MONGODB SANS AUTHENTIFICATION:');
    console.log('   mongod --dbpath ./data --noauth --port 27017');
    console.log('');

    console.log('2. OU CONFIGURER UN UTILISATEUR ADMIN:');
    console.log('   mongo');
    console.log('   use admin');
    console.log(
      '   db.createUser({user: "admin", pwd: "password", roles: ["root"]})'
    );
    console.log('');

    console.log('3. OU UTILISER UNE URI SANS AUTHENTIFICATION:');
    console.log('   MONGODB_URI=mongodb://localhost:27017/diaspomoney');
    console.log('');

    console.log('4. VÉRIFIER LA CONFIGURATION ACTUELLE:');
    console.log('   - Vérifiez que MongoDB est démarré: ps aux | grep mongod');
    console.log('   - Vérifiez le port: netstat -an | grep 27017');
    console.log('   - Vérifiez les logs: tail -f /var/log/mongodb/mongod.log');
    console.log('');

    console.log('5. COMMANDES DE DIAGNOSTIC:');
    console.log(
      '   - Tester la connexion: mongo --eval "db.runCommand({ping: 1})"'
    );
    console.log('   - Lister les bases: mongo --eval "show dbs"');
    console.log(
      '   - Vérifier les utilisateurs: mongo --eval "db.system.users.find()"'
    );
    console.log('');

    console.log('6. SOLUTION RECOMMANDÉE POUR LE DÉVELOPPEMENT:');
    console.log('   - Arrêter MongoDB: sudo systemctl stop mongod');
    console.log('   - Démarrer sans auth: mongod --dbpath ./data --noauth');
    console.log("   - Ou modifier /etc/mongod.conf pour désactiver l'auth");
    console.log('');

    console.log("7. VARIABLES D'ENVIRONNEMENT RECOMMANDÉES:");
    console.log('   MONGODB_URI=mongodb://localhost:27017/diaspomoney');
    console.log('   # OU avec authentification:');
    console.log(
      '   MONGODB_URI=mongodb://admin:password@localhost:27017/diaspomoney'
    );
    console.log('');

    console.log('✅ Instructions affichées');
    console.log(
      "📝 Suivez ces étapes pour résoudre les problèmes d'authentification"
    );
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

setupMongoDBDev();
