/**
 * Mappers pour les utilisateurs
 * Transforme les documents utilisateur en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import { UserDocument, UserResponse } from '@/lib/types';
import { LOCALE, ROLES, USER_STATUSES, TIMEZONES } from '@/lib/constants';

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'object' && date !== null && date !== undefined && 'toISOString' in date && typeof (date as Date).toISOString === 'function' && (date as Date).toISOString !== undefined) {
    return (date as Date).toISOString();
  }
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Classe UserMapper implémentant IMapper
 */
export class UserMapper implements IMapper<UserDocument, UserResponse> {
  /**
   * Transforme un document utilisateur vers une réponse API
   */
  map(input: UserDocument, options?: MappingOptions): UserResponse {
    return mapUserToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents utilisateur
   */
  mapMany(inputs: UserDocument[], options?: MappingOptions): UserResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const userMapper = new UserMapper();

/**
 * Mappe un document utilisateur vers une réponse API
 * 
 * @param userDoc - Document utilisateur depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapUserToResponse(
  userDoc: UserDocument,
  _options?: MappingOptions,
): UserResponse {
  // Extraire l'ID
  const id = userDoc['id'] || userDoc['_id']?.toString() || '';

  // Gérer l'avatar
  let avatar: { image: string; name: string };
  if (typeof userDoc.avatar === 'string') {
    avatar = {
      image: userDoc.avatar,
      name: userDoc['name'] || '',
    };
  } else if (userDoc.avatar && typeof userDoc.avatar === 'object') {
    avatar = {
      image: userDoc.avatar.image || '',
      name: userDoc.avatar.name || userDoc['name'] || '',
    };
  } else {
    avatar = {
      image: '',
      name: userDoc['name'] || '',
    };
  }

  // Gérer OAuth
  const oauth = userDoc.oauth || {
    google: { linked: false },
    facebook: { linked: false },
  };

  // Gérer les préférences
  const preferences = userDoc.preferences || {
    language: LOCALE.DEFAULT,
    timezone: TIMEZONES.PARIS,
    notifications: true,
  };

  return {
    id,
    email: userDoc['email'] || '',
    name: userDoc['name'] || `${userDoc['firstName'] || ''} ${userDoc['lastName'] || ''}`.trim() || '',
    firstName: userDoc['firstName'] || '',
    lastName: userDoc['lastName'] || '',
    phone: userDoc['phone'] || '',
    company: userDoc.company || '',
    address: userDoc.address || '',
    roles: userDoc['roles'] || [ROLES.CUSTOMER],
    status: userDoc['status'] || USER_STATUSES.ACTIVE,
    avatar,
    oauth: {
      google: oauth.google || { linked: false, providerAccountId: 'google-pierre' },
      facebook: oauth.facebook || { linked: false, providerAccountId: 'facebook-pierre' },
    },
    specialty: userDoc.specialty || '',
    recommended: userDoc.recommended ?? false,
    providerInfo: userDoc.providerInfo || {},
      preferences: {
        language: preferences.language || LOCALE.DEFAULT,
        timezone: preferences.timezone || TIMEZONES.PARIS,
        notifications: preferences.notifications !== false,
      },
    dateOfBirth: userDoc.dateOfBirth ? toISOString(userDoc.dateOfBirth) : null,
    countryOfResidence: userDoc.countryOfResidence || '',
    targetCountry: userDoc.targetCountry || '',
    targetCity: userDoc.targetCity || '',
    monthlyBudget: userDoc.monthlyBudget?.toString() || '',
    marketingConsent: userDoc.marketingConsent ?? false,
    kycConsent: userDoc.kycConsent ?? false,
    createdAt: toISOString(userDoc['createdAt']),
    updatedAt: toISOString(userDoc.updatedAt),
  };
}

