'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { CreateUserInput, UserRole, UserStatus } from '@/types';
import { ArrowLeft, Building, MapPin, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function NewProviderPage() {
  const { isCSM, isAuthenticated, isLoading } = useAuth();
  const [loading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.PROVIDER,
    company: '',
    address: '',
    roles: [],
    status: UserStatus.PENDING,
    specialty: '',
    clientNotes: '',
    avatar: '',
    recommended: false,
  });

  // Vérifier les permissions après le chargement
  if (!isAuthenticated) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-600 mb-4'>
          <h2 className='text-xl font-semibold'>Accès non autorisé</h2>
          <p className='text-gray-600'>
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoading && !isCSM()) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-600 mb-4'>
          <h2 className='text-xl font-semibold'>Accès non autorisé</h2>
          <p className='text-gray-600'>
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page. Seuls les CSM peuvent ajouter de nouveaux prestataires.
          </p>
        </div>
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
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Ajouter un nouveau prestataire
        </h1>
        <p className='text-gray-600 mt-2'>
          Créez un nouveau compte prestataire pour la plateforme
        </p>
      </div>

      {/* Form */}
      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <form className='space-y-6'>
          {/* Informations de base */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <User className='h-5 w-5 mr-2' />
              Informations de base
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nom complet *
                </label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Nom et prénom'
                  required
                />
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Nom et prénom'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email *
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='email@exemple.com'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Téléphone
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='+33 1 23 45 67 89'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Entreprise
                </label>
                <input
                  type='text'
                  name='company'
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <MapPin className='h-5 w-5 mr-2' />
              Adresse
            </h2>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Adresse complète
              </label>
              <textarea
                name='address'
                onChange={e =>
                  setFormData((prev: any) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Adresse complète'
              />
            </div>
          </div>

          {/* Spécialité */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <Building className='h-5 w-5 mr-2' />
              Spécialité
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Spécialité *
                </label>
                <input
                  type='text'
                  name='specialty'
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      specialty: e.target.value,
                    }))
                  }
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Ex: Cardiologie, Rénovation, Transport'
                />
              </div>
              <div className='flex items-center'>
                <input
                  title='Prestataire recommandé'
                  type='checkbox'
                  name='recommended'
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      recommended: e.target.checked,
                    }))
                  }
                  checked={Boolean(formData['recommended'])}
                  className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                />
                <label className='ml-2 block text-sm text-gray-900'>
                  Prestataire recommandé
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-4 pt-6 border-t border-gray-200'>
            <Link
              href='/dashboard/users'
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Annuler
            </Link>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
            >
              {loading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className='h-4 w-4 mr-2' />
                  Ajouter le prestataire
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
