import { mongoClient } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

console.log('[AUTH] Initializing NextAuth configuration');

// Configuration NextAuth avec gestion d'erreur
let authConfig: any;
try {
  authConfig = NextAuth({
    debug: process.env['NODE_ENV'] === 'development' ? true : false,
    providers: [
      // Provider Google OAuth (conditionnel)
      ...(process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']
        ? [
            Google({
              clientId: process.env['GOOGLE_CLIENT_ID'] as string,
              clientSecret: process.env['GOOGLE_CLIENT_SECRET'] as string,
            }),
          ]
        : []),
      
      // Provider Credentials pour l'authentification par email/mot de passe
      Credentials({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials: any) {
          console.log('[AUTH] Authorize called with:', {
            email: credentials?.email,
          });

          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          try {
            console.log('[AUTH] Connecting to MongoDB...');
            const client = await mongoClient;
            const db = client.db();
            const users = db.collection('users');

            console.log(
              '[AUTH] Looking for user:',
              (credentials.email as string).toLowerCase()
            );
            const user = await users.findOne({
              email: (credentials.email as string).toLowerCase(),
            });

            if (!user) {
              console.log('[AUTH] User not found');
              return null;
            }

            console.log('[AUTH] User found, checking password...');
            const isValid = await bcrypt.compare(
              credentials.password as string,
              user['password']
            );

            if (!isValid) {
              console.log('[AUTH] Invalid password');
              return null;
            }

            console.log('[AUTH] Authentication successful');
            return {
              id: user._id.toString(),
              email: user['email'],
              name:
                user['name'] ||
                `${user['firstName'] || ''} ${user['lastName'] || ''}`.trim(),
            };
          } catch (error) {
            console.error('[AUTH] Auth error:', error);
            return null;
          }
        },
      }),
    ],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-for-build',
    pages: {
      signIn: '/login',
      error: '/error',
      verifyRequest: '/verify-request',
      newUser: '/register',
    },
    callbacks: {
      async signIn({ user, account, profile }: { user: any, account: any, profile?: any }) {
        console.log('[AUTH] SignIn callback:', {
          email: user.email,
          provider: account?.provider,
        });

        // Si c'est une connexion OAuth (Google)
        if (account?.provider === 'google') {
          try {
            const client = await mongoClient;
            const db = client.db();
            const users = db.collection('users');

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await users.findOne({
              email: user.email?.toLowerCase(),
            });

            if (!existingUser) {
              console.log(
                `[AUTH] Creating new user from ${account.provider} OAuth`
              );
              // Créer un nouvel utilisateur selon le modèle User
              const newUser = {
                email: user.email?.toLowerCase(),
                name: user.name || '',
                firstName: (profile as any)?.given_name || (profile as any)?.['first_name'] || '',
                lastName: (profile as any)?.family_name || (profile as any)?.['last_name'] || '',
                avatar: user.image || '',
                emailVerified: true,
                roles: ['CUSTOMER'], // Rôle par défaut selon le modèle
                status: 'ACTIVE',
                oauth: {
                  google: {
                    linked: account.provider === 'google',
                    providerAccountId:
                      account.provider === 'google'
                        ? account.providerAccountId
                        : null,
                  },
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const result = await users.insertOne(newUser);
              console.log('[AUTH] New user created:', result.insertedId);
            } else {
              console.log('[AUTH] Existing user found:', existingUser._id);
              // Mettre à jour les informations OAuth selon le modèle
              const updateFields: any = {
                avatar: user.image || existingUser['avatar'],
                updatedAt: new Date(),
              };

              if (account.provider === 'google') {
                updateFields['oauth.google.linked'] = true;
                updateFields['oauth.google.providerAccountId'] =
                  account.providerAccountId;
              }

              await users.updateOne(
                { email: user.email?.toLowerCase() },
                { $set: updateFields }
              );
            }
          } catch (error) {
            console.error('[AUTH] OAuth user creation error:', error);
            return false; // Empêcher la connexion en cas d'erreur
          }
        }

        return true;
      },
      async jwt({ token, user, account }: { token: any, user: any, account: any }) {
        if (user) {
          token['id'] = user.id;
          token['provider'] = account?.provider;
          token['email'] = user.email as string | null;
          token['name'] = user.name as string | null;
        }
        return token;
      },
      async session({ session, token }: { session: any, token: any }) {
        if (token && session.user) {
          (session.user as typeof session.user & { id?: string }).id = token['id'] as string;
          (session.user as typeof session.user & { email?: string | null }).email = token['email'] as string | null;
          (session.user as typeof session.user & { name?: string | null }).name = token['name'] as string | null;
        }
        return session;
      },
    },
  });
} catch (error) {
  console.error('[AUTH] Error initializing NextAuth:', error);
  // Configuration de fallback
  authConfig = {
    handlers: {
      GET: () => new Response('Auth service unavailable', { status: 503 }),
      POST: () => new Response('Auth service unavailable', { status: 503 }),
    },
    auth: () => null,
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  };
}

// Exports directs
export const { handlers, auth, signIn, signOut } = authConfig;
