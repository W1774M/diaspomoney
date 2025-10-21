const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney');
    
    console.log('=== Vérification des utilisateurs ===');
    
    // Vérifier tous les utilisateurs
    const allUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Total users:', allUsers.length);
    
    // Vérifier les utilisateurs avec roles array
    const usersWithRoles = await mongoose.connection.db.collection('users').find({ roles: { $exists: true } }).toArray();
    console.log('Users with roles array:', usersWithRoles.length);
    
    // Vérifier les utilisateurs avec role string
    const usersWithRole = await mongoose.connection.db.collection('users').find({ role: { $exists: true } }).toArray();
    console.log('Users with role string:', usersWithRole.length);
    
    // Vérifier les PROVIDER
    const providers = await mongoose.connection.db.collection('users').find({ roles: 'PROVIDER' }).toArray();
    console.log('Providers with roles array:', providers.length);
    
    const providersRole = await mongoose.connection.db.collection('users').find({ role: 'PROVIDER' }).toArray();
    console.log('Providers with role string:', providersRole.length);
    
    // Afficher quelques exemples
    if (allUsers.length > 0) {
      console.log('\n=== Exemple d\'utilisateur ===');
      const user = allUsers[0];
      console.log('User structure:', {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        role: user.role,
        status: user.status
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUsers();
