/**
 * Listeners pour les événements d'authentification
 * Gère les actions automatiques lors des événements d'auth
 */

import { authEvents, UserLoggedInEvent } from '@/lib/events';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialiser tous les listeners d'authentification
 */
export function setupAuthEventListeners() {
  // Listener pour la connexion réussie
  authEvents.onUserLoggedIn(async (data: UserLoggedInEvent) => {
    console.log('[AuthEventListeners] User logged in:', data.userId);

    try {
      // 1. Envoyer une notification de bienvenue (si première connexion)
      // Note: Vous pouvez ajouter une logique pour détecter si c'est la première connexion
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
    } catch (error) {
      console.error('[AuthEventListeners] Error handling user logged in:', error);
      Sentry.captureException(error);
    }
  });

  // Listener pour l'inscription
  authEvents.onUserRegistered(async (data) => {
    console.log('[AuthEventListeners] User registered:', data.userId);

    try {
      // Envoyer un email de bienvenue
      await notificationService.sendNotification({
        recipient: data.userId,
        type: 'WELCOME',
        template: 'welcome',
        data: {
          email: data.email,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
        ],
        locale: 'fr',
        priority: 'HIGH',
      });

      // Logger pour analytics
      // analytics.track('user_registered', {
      //   userId: data.userId,
      //   email: data.email,
      // });
    } catch (error) {
      console.error('[AuthEventListeners] Error handling user registered:', error);
      Sentry.captureException(error);
    }
  });

  // Listener pour la déconnexion
  authEvents.onUserLoggedOut(async (data) => {
    console.log('[AuthEventListeners] User logged out:', data.userId);

    try {
      // Logger pour analytics
      // analytics.track('user_logged_out', {
      //   userId: data.userId,
      // });

      // Nettoyer les données de session côté serveur si nécessaire
      // await sessionService.clearUserSessions(data.userId);
    } catch (error) {
      console.error('[AuthEventListeners] Error handling user logged out:', error);
      Sentry.captureException(error);
    }
  });
}

