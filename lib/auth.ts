import { mongoClient } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  providers: [
    Google({
      clientId: process.env['GOOGLE_CLIENT_ID'] as string,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] as string,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
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
  },
  secret: process.env['NEXTAUTH_SECRET'] as string,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] SignIn callback:', {
        email: user.email,
        provider: account?.provider,
      });

      // Si c'est une connexion OAuth (Google ou Facebook)
      if (account?.provider === 'google' || account?.provider === 'facebook') {
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
              firstName: profile?.given_name || profile?.['first_name'] || '',
              lastName: profile?.family_name || profile?.['last_name'] || '',
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
                facebook: {
                  linked: account.provider === 'facebook',
                  providerAccountId:
                    account.provider === 'facebook'
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
            } else if (account.provider === 'facebook') {
              updateFields['oauth.facebook.linked'] = true;
              updateFields['oauth.facebook.providerAccountId'] =
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
    async jwt({ token, user, account }) {
      if (user) {
        token['id'] = user.id;
        token['provider'] = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as typeof session.user & { id?: string }).id = token[
          'id'
        ] as string;
      }
      return session;
    },
  },
});
