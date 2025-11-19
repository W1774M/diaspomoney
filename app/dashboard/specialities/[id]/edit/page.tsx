'use client';

/**
 * Page d'édition d'une spécialité
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useSpeciality, useSpecialityEdit, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 * - Middleware Pattern (authentification via useAuth)
 * - Decorator Pattern (@Log, @Cacheable, @Validate, @InvalidateCache dans specialityService)
 */

import { useAuth } from '@/hooks';
import { useSpeciality, useSpecialityEdit } from '@/hooks/specialities';
import { ISpeciality } from '@/lib/types';
import { ArrowLeft, Building, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditSpecialityPage() {
  const params = useParams();
  const specialityId = (params?.id as string) || null;
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { speciality, loading, error, fetchSpeciality } = useSpeciality();
  const {
    updateSpeciality,
    loading: saving,
    error: updateError,
  } = useSpecialityEdit();
  const [formData, setFormData] = useState<Partial<ISpeciality>>({
    name: '',
    group: 'sante',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (specialityId && isAuthenticated) {
      fetchSpeciality(specialityId);
    }
  }, [specialityId, isAuthenticated, fetchSpeciality]);

  useEffect(() => {
    if (speciality) {
      setFormData({
        name: speciality.name,
        description: speciality.description,
        group: speciality.group,
      });
    }
  }, [speciality]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specialityId || !formData.name) {
      return;
    }

    try {
      // Le hook gère déjà les erreurs via setError
      await updateSpeciality(specialityId, formData).then(() => {
        // Rediriger vers la page de détail seulement en cas de succès
        router.push(`/dashboard/specialities/${specialityId}`);
      });
    } catch (_err) {
      // Le hook gère déjà les erreurs et le logging est fait côté serveur
      // via SpecialityService avec @Log decorator
    }
  };

  const handleInputChange = (
    field: keyof ISpeciality,
    value: string | number,
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading || loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>Chargement de la spécialité...</p>
      </div>
    );
  }

  if (error || updateError) {
    return (
      <div className='text-center py-12'>
        <Building className='h-12 w-12 text-red-400 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>Erreur</h2>
        <p className='text-gray-600 mb-4'>
          {error || updateError || 'Une erreur est survenue'}
        </p>
        <Link
          href='/dashboard/specialities'
          className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)]'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Retour à la liste
        </Link>
      </div>
    );
  }

  if (!speciality) {
    return (
      <div className='text-center py-12'>
        <Building className='h-12 w-12 text-gray-400 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Spécialité non trouvée
        </h2>
        <p className='text-gray-600 mb-4'>
          La spécialité que vous recherchez n'existe pas.
        </p>
        <Link
          href='/dashboard/specialities'
          className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)]'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-6'>
        <div className='flex items-center mb-4'>
          <Link
            href={`/dashboard/specialities/${speciality._id}`}
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour
          </Link>
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Modifier {speciality.name}
        </h1>
        <p className='text-gray-600 mt-2'>
          Modifiez les informations de cette spécialité
        </p>
      </div>

      {/* Form */}
      <div className='bg-white rounded-lg shadow border border-gray-200'>
        <form onSubmit={handleSubmit} className='p-6'>
          <div className='space-y-6'>
            {/* Nom de la spécialité */}
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Nom de la spécialité *
              </label>
              <input
                type='text'
                id='name'
                required
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Ex: Cardiologie, Dermatologie, Orthodontie...'
              />
            </div>

            {/* Type de spécialité */}
            <div>
              <label
                htmlFor='type'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Type de spécialité *
              </label>
              <select
                id='group'
                title='Type de spécialité'
                required
                value={formData.group}
                onChange={e => handleInputChange('group', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='sante'>Santé</option>
                <option value='immo'>Immobilier</option>
                <option value='edu'>Éducation</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor='description'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Description
              </label>
              <textarea
                id='description'
                value={formData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Description de la spécialité'
                rows={3}
              />
            </div>

            {/* Informations système */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='text-sm font-medium text-gray-700 mb-3'>
                Informations système
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500'>ID MongoDB:</span>
                  <p className='text-gray-900 font-mono'>{speciality._id}</p>
                </div>
                <div>
                  <span className='text-gray-500'>Créé le:</span>
                  <p className='text-gray-900'>
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(speciality.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200'>
            <Link
              href={`/dashboard/specialities/${speciality._id}`}
              className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
            >
              Annuler
            </Link>
            <button
              type='submit'
              disabled={saving || !formData.name}
              className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {saving ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
