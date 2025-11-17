/**
 * Listeners pour les événements d'authentification
 * Gère les actions automatiques lors des événements d'auth
 */

import { authEvents, UserLoggedInEvent } from '@/lib/events';
import { logger } from '@/lib/logger';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialiser tous les listeners d'authentification
 */
export function setupAuthEventListeners() {
  // Listener pour la connexion réussie
  authEvents.onUserLoggedIn(async (data: UserLoggedInEvent) => {
    logger.info(
      { userId: data.userId, email: data.email },
      '[AuthEventListeners] User logged in',
    );

    try {
      // 1. Envoyer une notification de bienvenue (si première connexion)
      // Note: Vous pouvez ajouter une logique pour détecter si c'est la première connexion
      // Vérifier d'abord si le template existe avant d'envoyer
      try {
        await notificationService.sendNotification({
          recipient: data.userId,
          type: 'LOGIN_SUCCESS',
          template: 'login_success',
          data: {
            email: data.email,
            timestamp: data.timestamp.toISOString(),
          },
          channels: [
            { type: 'EMAIL', enabled: true, priority: 'LOW' },
            { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
          ],
          locale: 'fr',
          priority: 'LOW',
        });
      } catch (notificationError: unknown) {
        // Si le template n'existe pas, on log mais on ne fait pas échouer l'événement de connexion
        const errorMessage =
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown notification error';
        if (errorMessage.includes('Template non trouvé')) {
          logger.warn(
            { template: 'login_success', userId: data.userId },
            '[AuthEventListeners] Template de notification non disponible, ignoré',
          );
        } else {
          throw notificationError; // Re-lancer les autres erreurs
        }
      }

      // 2. Logger l'événement pour analytics
      // analytics.track('user_logged_in', {
      //   userId: data.userId,
      //   email: data.email,
      //   timestamp: data.timestamp,
      //   ipAddress: data.ipAddress,
      // });

      // 3. Mettre à jour la dernière connexion en base
      // await userRepository.update(data.userId, {
      //   lastLoginAt: data.timestamp,
      //   lastLoginIp: data.ipAddress,
      // });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(
        {
          error: errorMessage,
          errorStack,
          userId: data.userId,
        },
        '[AuthEventListeners] Error handling user logged in',
      );
      Sentry.captureException(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  });

  // Listener pour l'inscription
  authEvents.onUserRegistered(async data => {
    logger.info(
      { userId: data.userId, email: data.email },
      '[AuthEventListeners] User registered',
    );

    try {
      // Envoyer un email de bienvenue
      try {
        await notificationService.sendNotification({
          recipient: data.userId,
          type: 'WELCOME',
          template: 'welcome',
          data: {
            email: data.email,
          },
          channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
          locale: 'fr',
          priority: 'HIGH',
        });
      } catch (notificationError: unknown) {
        // Si le template n'existe pas, on log mais on ne fait pas échouer l'événement d'inscription
        const errorMessage =
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown notification error';
        if (errorMessage.includes('Template non trouvé')) {
          logger.warn(
            { template: 'welcome', userId: data.userId },
            '[AuthEventListeners] Template de bienvenue non disponible, ignoré',
          );
        } else {
          throw notificationError; // Re-lancer les autres erreurs
        }
      }

      // Logger pour analytics
      // analytics.track('user_registered', {
      //   userId: data.userId,
      //   email: data.email,
      // });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(
        {
          error: errorMessage,
          errorStack,
          userId: data.userId,
        },
        '[AuthEventListeners] Error handling user registered',
      );
      Sentry.captureException(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  });

  // Listener pour la déconnexion
  authEvents.onUserLoggedOut(async data => {
    logger.info(
      { userId: data.userId },
      '[AuthEventListeners] User logged out',
    );

    try {
      // Logger pour analytics
      // analytics.track('user_logged_out', {
      //   userId: data.userId,
      // });
      // Nettoyer les données de session côté serveur si nécessaire
      // await sessionService.clearUserSessions(data.userId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(
        {
          error: errorMessage,
          errorStack,
          userId: data.userId,
        },
        '[AuthEventListeners] Error handling user logged out',
      );
      Sentry.captureException(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  });
}
