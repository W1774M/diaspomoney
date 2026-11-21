/**
 * Prépare la base MongoDB des tests E2E : crée les comptes utilisés par loginAs().
 *
 * L'application vérifie chaque session via /api/users/me (recherche par e-mail) :
 * sans ces comptes en base, un utilisateur « connecté » n'a aucun rôle côté client.
 * Par sécurité, refuse de toucher une base dont le nom ne contient pas « test ».
 */
import { MongoClient } from 'mongodb';
import { testUsers } from './auth/helpers';

export default async function globalSetup(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    console.warn('[e2e] MONGODB_URI absent : comptes de test non créés (tests authentifiés en échec probable).');
    return;
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  try {
    const db = client.db();
    if (!/test/i.test(db.databaseName)) {
      throw new Error(`[e2e] Base « ${db.databaseName} » refusée : seules les bases de test sont autorisées.`);
    }
    const users = db.collection('users');
    const now = new Date();
    for (const user of Object.values(testUsers)) {
      const [firstName, ...rest] = user.name.split(' ');
      await users.updateOne(
        { email: user.email },
        {
          $set: {
            email: user.email,
            name: user.name,
            firstName,
            lastName: rest.join(' '),
            roles: user.roles,
            status: 'ACTIVE',
            isEmailVerified: true,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
  } finally {
    await client.close();
  }
}
