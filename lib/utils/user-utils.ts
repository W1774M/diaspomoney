/**
 * Utilitaires pour les utilisateurs
 * Fonctions helper pour les composants UI
 */

import { ROLES, USER_STATUSES } from '@/lib/constants';
import { RoleColor, StatusColor } from '@/lib/types';
import { Building2, Users } from 'lucide-react';
import React, { ReactElement } from 'react';

/**
 * Obtenir la couleur CSS pour un rôle
 */
export function getRoleColor(role: string): RoleColor {
  switch (role) {
    case ROLES.ADMIN:
    case ROLES.SUPERADMIN:
      return 'bg-red-100 text-red-800';
    case ROLES.CSM:
      return 'bg-purple-100 text-purple-800';
    case ROLES.PROVIDER:
      return 'bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]';
    case ROLES.CUSTOMER:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Obtenir la couleur CSS pour un statut
 */
export function getStatusColor(status: string): StatusColor {
  switch (status) {
    case USER_STATUSES.ACTIVE:
      return 'bg-green-100 text-green-800';
    case USER_STATUSES.INACTIVE:
      return 'bg-red-100 text-red-800';
    case USER_STATUSES.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case USER_STATUSES.SUSPENDED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Obtenir l'icône pour un rôle
 */
export function getRoleIcon(role: string): ReactElement {
  switch (role) {
    case ROLES.SUPERADMIN:
    case ROLES.ADMIN:
    case ROLES.CSM:
    case ROLES.CUSTOMER:
      return React.createElement(Users, { className: 'h-4 w-4' });
    case ROLES.PROVIDER:
      return React.createElement(Building2, { className: 'h-4 w-4' });
    default:
      return React.createElement(Users, { className: 'h-4 w-4' });
  }
}

/**
 * Formater une date en français
 */
export function formatUserDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}
