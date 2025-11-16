/**
 * NextAuth Configuration - DiaspoMoney
 * Configuration d'authentification NextAuth avec support OAuth et Credentials
 *
 * Implémente les design patterns :
 * - Repository Pattern (via getUserRepository)
 * - Dependency Injection (via getUserRepository)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Middleware Pattern (NextAuth callbacks)
 */

import { authEvents } from '@/lib/events';
import { childLogger } from '@/lib/logger';
import { getUserRepository } from '@/repositories';
import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env['FACEBOOK_CLIENT_ID'] ?? '',
      clientSecret: process.env['FACEBOOK_CLIENT_SECRET'] ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(
        credentials?: Record<'email' | 'password', string>
      ): Promise<{
        id: string;
        email: string;
        name: string;
        image: string | null;
      } | null> {
        const log = childLogger({
          component: 'NextAuth',
          action: 'authorize',
          provider: 'credentials',
        });

        try {
          log.debug('Starting credentials authorization');

          if (!credentials?.email || !credentials?.password) {
            log.warn('Missing email or password');
            return null;
          }

          const email = String(credentials.email).toLowerCase();
          const password = String(credentials.password);

          log.debug({ email }, 'Attempting login');

          // Utiliser le repository (Repository Pattern)
          const userRepository = getUserRepository();
          const user = await userRepository.findByEmail(email);

          if (!user) {
            log.warn({ email }, 'User not found');
            return null;
          }

          log.debug(
            { userId: user.id, email },
            'User found, checking password'
          );

          // Vérifier que le mot de passe existe et est hashé
          const storedPassword = (user as any).password;
          if (!storedPassword) {
            log.warn({ email }, 'No password set for user (OAuth only)');
            return null;
          }

          // Vérifier que storedPassword n'est pas le mot de passe en clair (sécurité)
          if (storedPassword.length < 20) {
            log.error(
              { email },
              'Password appears to be stored in plain text!'
            );
            Sentry.captureMessage('Password stored in plain text', {
              level: 'error',
              extra: { email, userId: user.id },
            });
            return null;
          }

          const valid = await bcrypt.compare(password, storedPassword);
          if (!valid) {
            log.warn({ email }, 'Invalid password');
            return null;
          }

          const status = user.status ?? 'ACTIVE';
          if (status !== 'ACTIVE') {
            log.warn({ email, status }, 'User account is not active');
            return null;
          }

          log.info({ email, userId: user.id }, 'Authentication successful');

          // Émettre l'événement de connexion réussie
          authEvents
            .emitUserLoggedIn({
              userId: user.id,
              email: user.email,
              timestamp: new Date(),
            })
            .catch(error => {
              log.error(
                { error, email, userId: user.id },
                'Error emitting user logged in event'
              );
              Sentry.captureException(error, {
                tags: {
                  component: 'NextAuth',
                  action: 'emitUserLoggedIn',
                },
                extra: { email, userId: user.id },
              });
            });

          // Retourner l'objet user avec toutes les informations nécessaires
          const userObject = {
            id: user.id,
            email: user.email,
            name:
              user.name ||
              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
              'User',
            image: (user as any)['image'] || null,
          };

          log.debug(
            {
              userId: userObject.id,
              email: userObject.email,
              name: userObject.name,
            },
            'Returning user object'
          );

          return userObject;
        } catch (error) {
          log.error({ error }, 'Authorization error');
          Sentry.captureException(error, {
            tags: {
              component: 'NextAuth',
              action: 'authorize',
              provider: 'credentials',
            },
          });
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: any;
      account: any;
      profile?: any;
    }) {
      const log = childLogger({
        component: 'NextAuth',
        action: 'signIn',
        provider: account?.provider,
      });

      try {
        log.debug({
          userId: user?.id,
          email: user?.email,
          name: user?.name,
          provider: account?.provider,
        });

        // Utiliser le repository (Repository Pattern)
        const userRepository = getUserRepository();

        // Pour les connexions OAuth (Google, Facebook)
        if (
          account?.provider === 'google' ||
          account?.provider === 'facebook'
        ) {
          log.debug('OAuth login detected - checking/creating user');

          const email = user.email?.toLowerCase();
          if (!email) {
            log.error('No email provided by OAuth provider');
            Sentry.captureMessage('OAuth provider did not provide email', {
              level: 'error',
              extra: { provider: account?.provider },
            });
            return false;
          }

          const existingUser = await userRepository.findByEmail(email);

          if (!existingUser) {
            log.info(
              { email, provider: account.provider },
              'Creating new OAuth user'
            );

            // Créer un nouvel utilisateur via le repository
            const newUser = await userRepository.create({
              email,
              name: user.name || '',
              image: user.image || '',
              emailVerified: new Date(),
              roles: ['CUSTOMER'],
              status: 'ACTIVE',
              oauth: {
                [account.provider]: {
                  linked: true,
                  providerAccountId: account.providerAccountId,
                },
              },
            } as any);

            user.id = newUser.id;
            log.info({ userId: user.id, email }, 'New OAuth user created');
          } else {
            log.debug(
              { userId: existingUser.id, email },
              'Existing user found, updating OAuth info'
            );

            // Mettre à jour les informations OAuth via le repository
            await userRepository.update(existingUser.id, {
              [`oauth.${account.provider}.linked`]: true,
              [`oauth.${account.provider}.providerAccountId`]:
                account.providerAccountId,
              ...(user.image && { image: user.image }),
              ...(user.name && { name: user.name }),
            } as any);

            user.id = existingUser.id;
          }

          // Émettre l'événement de connexion réussie pour OAuth
          authEvents
            .emitUserLoggedIn({
              userId: user.id,
              email: user.email!,
              timestamp: new Date(),
            })
            .catch(error => {
              log.error(
                { error, userId: user.id, email: user.email },
                'Error emitting user logged in event'
              );
              Sentry.captureException(error, {
                tags: {
                  component: 'NextAuth',
                  action: 'emitUserLoggedIn',
                  provider: 'oauth',
                },
                extra: { userId: user.id, email: user.email },
              });
            });

          log.info(
            { userId: user.id, provider: account.provider },
            'OAuth sign in authorized'
          );
          return true;
        }

        // Pour les connexions par credentials
        // Le statut a déjà été vérifié dans authorize(), donc on accepte directement
        if (account?.provider === 'credentials') {
          log.debug(
            'Credentials login - user already validated in authorize()'
          );

          // Vérifier que l'utilisateur a bien un email et un id
          if (!user.email) {
            log.error('No email found in user object for credentials');
            Sentry.captureMessage('No email in user object for credentials', {
              level: 'error',
            });
            return false;
          }

          if (!user.id) {
            log.error('No id found in user object for credentials');
            Sentry.captureMessage('No id in user object for credentials', {
              level: 'error',
            });
            return false;
          }

          log.info(
            { email: user.email, userId: user.id },
            'Credentials sign in authorized'
          );
          return true;
        }

        return true;
      } catch (error) {
        log.error({ error }, 'Sign in error');
        Sentry.captureException(error, {
          tags: {
            component: 'NextAuth',
            action: 'signIn',
            provider: account?.provider,
          },
        });
        return false;
      }
    },

    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user: any;
      account: any;
    }) {
      const log = childLogger({
        component: 'NextAuth',
        action: 'jwt',
      });

      try {
        log.debug({
          hasToken: !!token,
          hasUserId: !!token?.userId,
          hasEmail: !!token?.email,
          hasUser: !!user,
          provider: account?.provider,
        });

        // Initialiser token s'il n'existe pas
        if (!token) {
          log.warn('Token is null or undefined, initializing');
          token = {};
        }

        // Premier appel (connexion) - l'objet user est présent
        if (user) {
          log.debug(
            { userId: user.id, email: user.email },
            'First call - setting token from user'
          );
          token.provider = account?.provider;
          token.providerAccountId = account?.providerAccountId;
          token.userId = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = (user as any)['image'];
        }

        // Si userId n'est toujours pas défini (fallback pour sécurité)
        if (token && !token.userId && token.email) {
          log.debug(
            { email: token.email },
            'UserId missing, fetching from repository by email'
          );
          try {
            // Utiliser le repository (Repository Pattern)
            const userRepository = getUserRepository();
            const dbUser = await userRepository.findByEmail(
              token.email.toLowerCase()
            );

            if (dbUser) {
              log.debug({ userId: dbUser.id }, 'User found in repository');
              token.userId = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.picture = (dbUser as any)['image'];
            }
          } catch (error) {
            log.error(
              { error, email: token.email },
              'Error fetching user from repository'
            );
            Sentry.captureException(error, {
              tags: {
                component: 'NextAuth',
                action: 'jwt',
                step: 'fetchUserByEmail',
              },
              extra: { email: token.email },
            });
          }
        }

        log.debug(
          {
            userId: token?.userId,
            email: token?.email,
            name: token?.name,
          },
          'Token finalized'
        );

        return token;
      } catch (error) {
        log.error({ error }, 'JWT callback error');
        Sentry.captureException(error, {
          tags: {
            component: 'NextAuth',
            action: 'jwt',
          },
        });
        // Retourner le token même en cas d'erreur pour éviter de casser la session
        return token || {};
      }
    },

    async session({ session, token }: { session: any; token: any }) {
      const log = childLogger({
        component: 'NextAuth',
        action: 'session',
      });

      try {
        log.debug({
          hasSession: !!session,
          hasToken: !!token,
          hasEmail: !!token?.email,
          hasUserId: !!token?.userId,
        });

        // Si pas de session, retourner null (pas de session active)
        // Dans NextAuth v5, retourner null est valide pour indiquer aucune session
        if (!session) {
          log.debug('No session, returning null');
          return null;
        }

        // S'assurer que session.user existe
        if (!session.user) {
          session.user = {};
        }

        // Si pas de token ou token vide, retourner session vide mais valide
        if (!token || (!token.email && !token.userId)) {
          log.debug('No token or empty token, returning empty session');
          // Retourner une session vide mais valide avec user: null
          return {
            ...session,
            user: null,
            expires:
              session.expires ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }

        // Enrichir la session avec les données du token
        if (token.email) {
          session.user.email = token.email;
        }
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.userId) {
          (session.user as any).id = token.userId;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }

        // Ajouter les informations du provider
        if (token.provider) {
          (session as any).provider = token.provider;
        }
        if (token.providerAccountId) {
          (session as any).providerAccountId = token.providerAccountId;
        }

        log.debug(
          { userId: token.userId, email: token.email },
          'Session enriched successfully'
        );

        return session;
      } catch (error) {
        log.error({ error }, 'Session callback error');
        Sentry.captureException(error, {
          tags: {
            component: 'NextAuth',
            action: 'session',
          },
        });
        // Retourner une session vide pour éviter une erreur 500
        try {
          return { user: {} };
        } catch {
          // Si même ça échoue, retourner null
          return null;
        }
      }
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      const log = childLogger({
        component: 'NextAuth',
        action: 'redirect',
      });

      log.debug({ url, baseUrl }, 'Processing redirect');

      // Si l'URL est relative, retourner une URL relative
      if (url && url.startsWith('/')) {
        if (url.startsWith('/dashboard')) {
          log.debug({ url }, 'Relative redirect to dashboard');
          return url;
        }
        log.debug('Default redirect to /dashboard');
        return '/dashboard';
      }

      // Si l'URL est absolue, vérifier qu'elle est sur le bon domaine
      try {
        // Vérifier que url est valide avant de créer l'URL
        if (!url || url.trim() === '') {
          log.warn('Empty URL, redirecting to /dashboard');
          return '/dashboard';
        }

        const urlObj = new URL(url);

        // Vérifier que baseUrl est valide avant de créer l'URL
        if (!baseUrl || baseUrl.trim() === '') {
          // Si baseUrl est invalide, extraire juste le chemin de l'URL
          log.warn(
            { pathname: urlObj.pathname },
            'Invalid base URL, extracting path'
          );
          return urlObj.pathname + urlObj.search || '/dashboard';
        }

        const baseUrlObj = new URL(baseUrl);

        if (urlObj.origin === baseUrlObj.origin) {
          log.debug({ url }, 'Redirecting to authorized URL');
          return url;
        }

        log.debug(
          { pathname: urlObj.pathname },
          'External URL detected, extracting path'
        );
        return urlObj.pathname + urlObj.search;
      } catch (error) {
        log.warn({ error, url }, 'Invalid URL, redirecting to /dashboard');
        Sentry.captureException(error, {
          tags: {
            component: 'NextAuth',
            action: 'redirect',
          },
          extra: { url, baseUrl },
        });
        return '/dashboard';
      }
    },
  },
};
