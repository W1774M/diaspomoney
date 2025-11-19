'use client';

/**
 * Page de détail d'un utilisateur
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useUser, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 * - Middleware Pattern (authentification via useAuth)
 */

import { useAuth, useUser } from '@/hooks';
import {
  formatUserDate,
  getRoleColor,
  getRoleIcon,
  getStatusColor,
} from '@/lib/utils/user-utils';
import { UserRole } from '@/types';
import { ArrowLeft, Edit, Mail, Phone, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { user, loading, error, fetchUser } = useUser();

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchUser(userId);
    }
  }, [isAuthenticated, userId, fetchUser]);

  if (authLoading || loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>
          Chargement de l&apos;utilisateur...
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>{error || 'Utilisateur non trouvé'}</p>
        <Link
          href='/dashboard/users'
          className='mt-4 inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Retour aux utilisateurs
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <Link
            href='/dashboard/users'
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour aux utilisateurs
          </Link>
          <Link
            href={`/dashboard/users/${user._id}/edit`}
            className='flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
          >
            <Edit className='h-4 w-4 mr-2' />
            Modifier
          </Link>
        </div>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{user.name}</h1>
            <p className='text-gray-600 mt-2'>
              Membre depuis le {formatUserDate(user.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              user.status,
            )}`}
          >
            {user.status}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Informations principales */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Informations de base */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations de base
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nom complet
                </label>
                <p className='text-gray-900 font-medium'>{user.name}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <p className='text-gray-900'>{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Téléphone
                  </label>
                  <p className='text-gray-900'>{user.phone}</p>
                </div>
              )}
              {user.company && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Entreprise
                  </label>
                  <p className='text-gray-900'>{user.company}</p>
                </div>
              )}
              {user.address && (
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Adresse
                  </label>
                  <p className='text-gray-900'>{user.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rôles et statut */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Rôles et statut
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Rôles
                </label>
                <div className='flex flex-wrap gap-2'>
                  {user.roles.map(role => (
                    <span
                      key={role}
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        role,
                      )}`}
                    >
                      {getRoleIcon(role)}
                      <span className='ml-1'>{role}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    user.status,
                  )}`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Informations spécifiques aux prestataires */}
          {user.roles.includes(UserRole.PROVIDER) && (
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Informations prestataire
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {user.specialty && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Spécialité
                    </label>
                    <p className='text-gray-900'>{user.specialty}</p>
                  </div>
                )}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Recommandé
                  </label>
                  <div className='flex items-center'>
                    {user.recommended ? (
                      <>
                        <Star className='h-4 w-4 text-yellow-500 mr-2' />
                        <span className='text-gray-900'>Oui</span>
                      </>
                    ) : (
                      <span className='text-gray-500'>Non</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations spécifiques aux clients */}
          {user.roles.includes(UserRole.CUSTOMER) && user.clientNotes && (
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Informations client
              </h2>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notes client
                </label>
                <p className='text-gray-700 bg-gray-50 p-3 rounded-lg'>
                  {user.clientNotes}
                </p>
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
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Langue
                </label>
                <p className='text-gray-900'>
                  {user.preferences?.language === 'fr'
                    ? 'Français'
                    : user.preferences?.language === 'en'
                    ? 'English'
                    : 'Español'}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fuseau horaire
                </label>
                <p className='text-gray-900'>{user.preferences?.timezone}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Notifications
                </label>
                <p className='text-gray-900'>
                  {user.preferences?.notifications ? 'Activées' : 'Désactivées'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Actions rapides */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Actions rapides
            </h2>
            <div className='space-y-2'>
              <Link
                href={`/dashboard/users/${user._id}/edit`}
                className='w-full flex items-center justify-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
              >
                <Edit className='h-4 w-4 mr-2' />
                Modifier l'utilisateur
              </Link>
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className='w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Mail className='h-4 w-4 mr-2' />
                  Envoyer un email
                </a>
              )}
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                >
                  <Phone className='h-4 w-4 mr-2' />
                  Appeler
                </a>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations système
            </h2>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  ID Utilisateur
                </label>
                <p className='text-sm text-gray-500 font-mono'>{user._id}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Créé le
                </label>
                <p className='text-sm text-gray-500'>
                  {formatUserDate(user.createdAt)}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Modifié le
                </label>
                <p className='text-sm text-gray-500'>
                  {formatUserDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Statistiques
            </h2>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Factures</span>
                <span className='text-lg font-bold text-gray-900'>0</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Tâches</span>
                <span className='text-lg font-bold text-gray-900'>0</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Projets</span>
                <span className='text-lg font-bold text-gray-900'>0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
