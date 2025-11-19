'use client';

/**
 * Page de création d'un nouvel utilisateur
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useCreateUser)
 * - Toast Pattern (via useNotificationManager)
 * - Error Handling Pattern (via logger)
 */

import { useCreateUser } from '@/hooks/users';
import { useNotificationManager } from '@/components/ui/Notification';
import { logger } from '@/lib/logger';
import {
  USER_ROLES,
  USER_STATUSES,
} from '@/lib/types';
import { LANGUAGES, TIMEZONES, USER_STATUSES as CONST_USER_STATUSES } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function NewUserPage() {
  const router = useRouter();
  const { createUser, loading } = useCreateUser();
  const { addSuccess, addError } = useNotificationManager();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    company: '',
    address: '',
    roles: [] as string[],
    status: CONST_USER_STATUSES.ACTIVE,
    specialty: '',
    recommended: false,
    clientNotes: '',
    avatar: '',
    preferences: {
      language: LANGUAGES.FR.code,
      timezone: TIMEZONES.PARIS,
      notifications: true,
    },
  });

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleRoleChange = useCallback((role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }));
  }, []);

  const handlePreferenceChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation côté client
      if (!formData.email || !formData.name || formData.roles.length === 0) {
        addError(
          'Veuillez remplir tous les champs obligatoires (email, nom, rôles)',
          6000,
        );
        return;
      }

      try {
        logger.info(
          {
            email: formData.email,
            roles: formData.roles,
            status: formData.status,
          },
          'Submitting user creation form',
        );

        // Utiliser le hook personnalisé (Custom Hooks Pattern)
        const result = await createUser({
          email: formData.email,
          name: formData.name,
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          roles: formData.roles,
          status: formData.status,
          specialty: formData.specialty,
          recommended: formData.recommended,
          clientNotes: formData.clientNotes,
          preferences: formData.preferences,
        });

        if (result.success && result.user) {
          logger.info(
            {
              userId: result.user.id || result.user._id,
              email: result.user.email,
            },
            'User created successfully',
          );

          // Utiliser les toasts au lieu d'alert (Toast Pattern)
          addSuccess(
            `Utilisateur créé avec succès ! Email : ${result.user.email}`,
            8000,
          );

          // Rediriger vers la liste des utilisateurs
          router.push('/dashboard/users');
        } else {
          const errorMessage =
            result.error || "Erreur lors de la création de l'utilisateur";
          logger.error(
            {
              error: result.error,
              email: formData.email,
            },
            'User creation failed',
          );
          addError(errorMessage, 8000);
        }
      } catch (error) {
        logger.error(
          {
            error,
            email: formData.email,
            roles: formData.roles,
          },
          'Error submitting user creation form',
        );
        addError(
          "Erreur lors de la création de l'utilisateur. Veuillez réessayer.",
          8000,
        );
      }
    },
    [formData, createUser, addSuccess, addError, router],
  );

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <Link
            href='/dashboard/users'
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour aux utilisateurs
          </Link>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>Nouvel Utilisateur</h1>
        <p className='text-gray-600 mt-2'>
          Créez un nouvel utilisateur dans le système
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Informations de base */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Informations de base
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nom complet *
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Jean Dupont'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email *
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='jean.dupont@email.com'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Téléphone
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='+33 1 23 45 67 89'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Entreprise
              </label>
              <input
                type='text'
                value={formData.company}
                onChange={e => handleInputChange('company', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Entreprise ABC'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Adresse
              </label>
              <textarea
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='123 Rue de la Paix, 75001 Paris, France'
              />
            </div>
          </div>
        </div>

        {/* Rôles et statut */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Rôles et statut
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Rôles *
              </label>
              <div className='space-y-2'>
                {USER_ROLES.map(role => (
                  <label key={role} className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={formData.roles.includes(role)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                      className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                    />
                    <span className='ml-2 text-sm text-gray-700'>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                title="Statut de l'utilisateur"
                aria-label="Statut de l'utilisateur"
              >
                {USER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informations spécifiques aux prestataires */}
        {formData.roles.includes('PROVIDER') && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations prestataire
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Spécialité
                </label>
                <input
                  type='text'
                  value={formData.specialty}
                  onChange={e => handleInputChange('specialty', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Cardiologie, BTP, etc.'
                />
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='recommended'
                  checked={formData.recommended}
                  onChange={e =>
                    handleInputChange('recommended', e.target.checked)
                  }
                  className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                  title='Prestataire recommandé'
                  aria-label='Prestataire recommandé'
                />
                <label htmlFor='recommended' className='ml-2 text-sm text-gray-700'>
                  Prestataire recommandé
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Informations spécifiques aux clients */}
        {formData.roles.includes('CUSTOMER') && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations client
            </h2>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Notes client
              </label>
              <textarea
                value={formData.clientNotes}
                onChange={e => handleInputChange('clientNotes', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Notes sur le client...'
              />
            </div>
          </div>
        )}

        {/* Préférences */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Préférences
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Langue
              </label>
              <select
                value={formData.preferences.language}
                onChange={e =>
                  handlePreferenceChange('language', e.target.value)
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                title='Langue préférée'
                aria-label='Langue préférée'
              >
                <option value='fr'>Français</option>
                <option value='en'>English</option>
                <option value='es'>Español</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Fuseau horaire
              </label>
              <select
                value={formData.preferences.timezone}
                onChange={e =>
                  handlePreferenceChange('timezone', e.target.value)
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                title='Fuseau horaire'
                aria-label='Fuseau horaire'
              >
                <option value='Europe/Paris'>Europe/Paris</option>
                <option value='UTC'>UTC</option>
                <option value='America/New_York'>America/New_York</option>
              </select>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='notifications'
                checked={formData.preferences.notifications}
                onChange={e =>
                  handlePreferenceChange('notifications', e.target.checked)
                }
                className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                title='Notifications activées'
                aria-label='Notifications activées'
              />
              <label htmlFor='notifications' className='ml-2 text-sm text-gray-700'>
                Notifications activées
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end space-x-4'>
          <Link
            href='/dashboard/users'
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Annuler
          </Link>
          <button
            type='submit'
            disabled={loading || formData.roles.length === 0}
            className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Création...' : "Créer l'utilisateur"}
          </button>
        </div>
      </form>
    </>
  );
}
