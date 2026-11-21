'use client';

/**
 * Page de détail d'un utilisateur
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useUser, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 * - Middleware Pattern (authentification via useAuth)
 */

import { useUser } from '@/hooks';
import {
  formatUserDate,
  getRoleColor,
  getRoleIcon,
  getStatusColor,
} from '@/lib/utils/user-utils';
import { UserRole } from '@/lib/types';
import { AuthorizedRoute } from '@/components/auth';
import { ArrowLeft, Edit, Mail, Phone, Star, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNotificationManager } from '@/components/ui/Notification';
import { USER_STATUSES } from '@/lib/constants';

/**
 * Contenu de la page de détail d'un utilisateur
 */
function UserDetailPageContent() {
  const params = useParams();
  const userId = params.id as string;
  const { user, loading, error, fetchUser } = useUser();
  const { addSuccess, addError } = useNotificationManager();
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  const handleResendActivation = async () => {
    if (!userId || !user) return;

    setIsResending(true);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/resend-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du lien d'activation");
      }

      addSuccess('Lien d\'activation renvoyé avec succès', 5000);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de l'envoi du lien d'activation. Veuillez réessayer.";
      addError(errorMessage, 8000);
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
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
        <div className='flex items-center mb-4'>
          <Link
            href='/dashboard/users'
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour aux utilisateurs
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
                  {user.roles.map((role: UserRole) => (
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
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Informations prestataire
              </h2>
              
              {/* Type et Catégorie */}
              {(user.providerInfo as any)?.type && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Type
                    </label>
                    <p className='text-gray-900'>
                      {(user.providerInfo as any)?.type === 'INSTITUTION' ? 'Entreprise' : 'Individuel'}
                    </p>
                  </div>
                  {(user.providerInfo as any)?.category && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Catégorie
                      </label>
                      <p className='text-gray-900'>
                        {(user.providerInfo as any)?.category === 'HEALTH' ? 'Santé' :
                         (user.providerInfo as any)?.category === 'BTP' ? 'BTP' :
                         (user.providerInfo as any)?.category === 'EDUCATION' ? 'Éducation' :
                         (user.providerInfo as any)?.category}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommandé - Vérifier à la fois user.recommended et providerInfo.recommended */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Recommandé
                </label>
                <div className='flex items-center'>
                  {(user.recommended || (user.providerInfo as any)?.recommended) ? (
                    <>
                      <Star className='h-4 w-4 text-yellow-500 mr-2 fill-current' />
                      <span className='text-gray-900 font-medium'>Oui</span>
                    </>
                  ) : (
                    <span className='text-gray-500'>Non</span>
                  )}
                </div>
              </div>

              {/* Spécialités */}
              {((user.specialties && user.specialties.length > 0) || 
                ((user.providerInfo as any)?.specialties && (user.providerInfo as any).specialties.length > 0)) && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Spécialités
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {((user.providerInfo as any)?.specialties || user.specialties || []).map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]'
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spécialité (ancien champ) */}
              {user.specialty && !user.specialties && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Spécialité
                  </label>
                  <p className='text-gray-900'>{user.specialty}</p>
                </div>
              )}

              {/* Informations Institution */}
              {(user.providerInfo as any)?.type === 'INSTITUTION' && (user.providerInfo as any)?.institution && (
                <div className='border-t border-gray-200 pt-4'>
                  <h3 className='text-md font-semibold text-gray-800 mb-3'>Informations entreprise</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(user.providerInfo as any).institution.legalName && (
                      <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Nom légal
                        </label>
                        <p className='text-gray-900 font-medium'>
                          {(user.providerInfo as any).institution.legalName}
                        </p>
                      </div>
                    )}
                    {(user.providerInfo as any).institution.registrationNumber && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Numéro d'enregistrement
                        </label>
                        <p className='text-gray-900'>
                          {(user.providerInfo as any).institution.registrationNumber}
                        </p>
                      </div>
                    )}
                    {(user.providerInfo as any).institution.taxId && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Numéro TVA
                        </label>
                        <p className='text-gray-900'>
                          {(user.providerInfo as any).institution.taxId}
                        </p>
                      </div>
                    )}
                    {/* Numéros d'enregistrement depuis registrationNumbers */}
                    {(user.providerInfo as any).institution.registrationNumbers && (
                      <>
                        {(user.providerInfo as any).institution.registrationNumbers.rcs && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              RCS
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).institution.registrationNumbers.rcs}
                            </p>
                          </div>
                        )}
                        {(user.providerInfo as any).institution.registrationNumbers.siret && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              SIRET
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).institution.registrationNumbers.siret}
                            </p>
                          </div>
                        )}
                        {(user.providerInfo as any).institution.registrationNumbers.siren && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              SIREN
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).institution.registrationNumbers.siren}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {/* Certifications */}
                    {(user.providerInfo as any).institution.certifications && 
                     (user.providerInfo as any).institution.certifications.length > 0 && (
                      <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Certifications
                        </label>
                        <ul className='list-disc list-inside space-y-1'>
                          {(user.providerInfo as any).institution.certifications.map((cert: string, index: number) => (
                            <li key={index} className='text-gray-700 text-sm'>{cert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations Individuel */}
              {(user.providerInfo as any)?.type === 'INDIVIDUAL' && (user.providerInfo as any)?.individual && (
                <div className='border-t border-gray-200 pt-4'>
                  <h3 className='text-md font-semibold text-gray-800 mb-3'>Informations individuelles</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {(user.providerInfo as any).individual.firstName && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Prénom
                        </label>
                        <p className='text-gray-900'>
                          {(user.providerInfo as any).individual.firstName}
                        </p>
                      </div>
                    )}
                    {(user.providerInfo as any).individual.lastName && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Nom
                        </label>
                        <p className='text-gray-900'>
                          {(user.providerInfo as any).individual.lastName}
                        </p>
                      </div>
                    )}
                    {/* Numéros d'enregistrement depuis registrationNumbers */}
                    {(user.providerInfo as any).individual.registrationNumbers && (
                      <>
                        {(user.providerInfo as any).individual.registrationNumbers.rcs && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              RCS
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).individual.registrationNumbers.rcs}
                            </p>
                          </div>
                        )}
                        {(user.providerInfo as any).individual.registrationNumbers.tva && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              TVA
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).individual.registrationNumbers.tva}
                            </p>
                          </div>
                        )}
                        {(user.providerInfo as any).individual.registrationNumbers.siret && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              SIRET
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).individual.registrationNumbers.siret}
                            </p>
                          </div>
                        )}
                        {(user.providerInfo as any).individual.registrationNumbers.siren && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              SIREN
                            </label>
                            <p className='text-gray-900 font-mono text-sm'>
                              {(user.providerInfo as any).individual.registrationNumbers.siren}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Adresse professionnelle */}
              {(user.providerInfo as any)?.professionalAddress && (
                <div className='border-t border-gray-200 pt-4'>
                  <h3 className='text-md font-semibold text-gray-800 mb-3'>Adresse professionnelle</h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <p className='text-gray-900'>
                      {(user.providerInfo as any).professionalAddress.street}
                    </p>
                    <p className='text-gray-700'>
                      {(user.providerInfo as any).professionalAddress.postalCode} {(user.providerInfo as any).professionalAddress.city}
                    </p>
                    <p className='text-gray-700'>
                      {(user.providerInfo as any).professionalAddress.country}
                    </p>
                  </div>
                </div>
              )}
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
                <p className='text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap'>
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
                    : user.preferences?.language === 'es'
                    ? 'Español'
                    : user.preferences?.language || 'Français'}
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
              {user.status === USER_STATUSES.PENDING && (
                <button
                  onClick={handleResendActivation}
                  disabled={isResending}
                  className='w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Send className='h-4 w-4 mr-2' />
                  {isResending ? 'Envoi...' : 'Renvoyer le lien d\'activation'}
                </button>
              )}
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

/**
 * Page de détail d'un utilisateur
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function UserDetailPage() {
  return (
    <AuthorizedRoute redirectTo="/login">
      <UserDetailPageContent />
    </AuthorizedRoute>
  );
}
