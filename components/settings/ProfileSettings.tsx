'use client';

import { useAuth } from '@/hooks';
import imageLoader from '@/lib/image-loader';
import type { ProfileSettingsProps } from '@/lib/types';
import {
  Building,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Save,
  Smartphone,
  Trash2,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const ProfileSettings = React.memo<ProfileSettingsProps>(
  function ProfileSettings({ data, setData, onSave, saving }) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [deletingAvatar, setDeletingAvatar] = useState(false);

    // Charger l'avatar depuis les données utilisateur
    useEffect(() => {
      if (user) {
        const userAvatar = (user as any).avatar;
        if (typeof userAvatar === 'string') {
          setAvatarUrl(userAvatar);
        } else if (userAvatar?.image) {
          setAvatarUrl(userAvatar.image);
        }
      }
    }, [user]);

    const handleChange = useCallback(
      (field: keyof typeof data, value: string) => {
        setData({ ...data, [field]: value });
      },
      [data, setData],
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
      },
      [onSave],
    );

    const handleAvatarUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
          const formData = new FormData();
          formData.append('avatar', file);

          const response = await fetch('/api/users/me/avatar', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur lors de l'upload");
          }

          const result = await response.json();
          setAvatarUrl(result.avatar);
          // Rafraîchir la page pour mettre à jour l'avatar partout
          window.location.reload();
        } catch (error) {
          console.error("Erreur lors de l'upload de l'avatar:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Erreur lors de l'upload de la photo de profil",
          );
        } finally {
          setUploadingAvatar(false);
        }
      },
      [],
    );

    const handleAvatarDelete = useCallback(async () => {
      if (
        !confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')
      ) {
        return;
      }

      setDeletingAvatar(true);
      try {
        const response = await fetch('/api/users/me/avatar', {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        setAvatarUrl(null);
        // Rafraîchir la page pour mettre à jour l'avatar partout
        window.location.reload();
      } catch (error) {
        console.error("Erreur lors de la suppression de l'avatar:", error);
        alert(
          error instanceof Error
            ? error.message
            : 'Erreur lors de la suppression de la photo de profil',
        );
      } finally {
        setDeletingAvatar(false);
      }
    }, []);

    return (
      <div className='space-y-6'>
        {/* Photo de profil */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Photo de profil
            </h2>
            <p className='text-gray-600'>
              Ajoutez une photo de profil pour personnaliser votre compte.
            </p>
          </div>

          <div className='flex items-center space-x-6'>
            {/* Aperçu de l'avatar */}
            <div className='relative'>
              {avatarUrl ? (
                <div className='relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200'>
                  <Image
                    src={avatarUrl}
                    alt='Photo de profil'
                    fill
                    className='object-cover'
                    loader={imageLoader}
                    unoptimized
                  />
                </div>
              ) : (
                <div className='w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300'>
                  <User className='h-12 w-12 text-gray-400' />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex flex-col space-y-3'>
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarUpload}
                  className='hidden'
                  aria-label='Uploader une photo de profil'
                />
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar || saving}
                  className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {uploadingAvatar ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      <span>Upload en cours...</span>
                    </>
                  ) : (
                    <>
                      <Upload className='h-4 w-4 mr-2' />
                      <span>Choisir une photo</span>
                    </>
                  )}
                </button>
              </div>

              {avatarUrl && (
                <button
                  type='button'
                  onClick={handleAvatarDelete}
                  disabled={deletingAvatar || saving}
                  className='flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {deletingAvatar ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2'></div>
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className='h-4 w-4 mr-2' />
                      <span>Supprimer la photo</span>
                    </>
                  )}
                </button>
              )}

              <p className='text-xs text-gray-500'>
                Formats acceptés: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Informations personnelles
            </h2>
            <p className='text-gray-600'>
              Gérez vos informations de profil et de contact.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom complet *
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='text'
                    value={data.name}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                    placeholder='Votre nom complet'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Prénom
                </label>
                <input
                  type='text'
                  value={data.firstName}
                  onChange={e => handleChange('firstName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Votre prénom'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom de famille
                </label>
                <input
                  type='text'
                  value={data.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Votre nom de famille'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='email'
                    value={data.email}
                    disabled
                    aria-label='Email (non modifiable)'
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    L'email ne peut pas être modifié
                  </p>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Smartphone className='h-4 w-4 inline mr-1' />
                  Téléphone
                </label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='tel'
                    value={data.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                    placeholder='+33 1 23 45 67 89'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Calendar className='h-4 w-4 inline mr-1' />
                  Date de naissance
                </label>
                <input
                  type='date'
                  value={data.dateOfBirth}
                  onChange={e => handleChange('dateOfBirth', e.target.value)}
                  aria-label='Date de naissance'
                  title='Date de naissance'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <MapPin className='h-4 w-4 inline mr-1' />
                Adresse
              </label>
              <textarea
                value={data.address}
                onChange={e => handleChange('address', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                placeholder='Votre adresse complète'
              />
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
              >
                <Save className='h-4 w-4 mr-2' />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>

        {/* Informations professionnelles */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Informations professionnelles
            </h2>
            <p className='text-gray-600'>
              Informations liées à votre activité professionnelle.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Building className='h-4 w-4 inline mr-1' />
                  Entreprise
                </label>
                <input
                  type='text'
                  value={data.company}
                  onChange={e => handleChange('company', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Nom de votre entreprise'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Spécialité
                </label>
                <input
                  type='text'
                  value={data.specialty}
                  onChange={e => handleChange('specialty', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Votre spécialité professionnelle'
                />
              </div>
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
              >
                <Save className='h-4 w-4 mr-2' />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>

        {/* Localisation */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Localisation
            </h2>
            <p className='text-gray-600'>
              Informations sur votre localisation actuelle et cible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Pays de résidence
                </label>
                <input
                  type='text'
                  value={data.countryOfResidence}
                  onChange={e =>
                    handleChange('countryOfResidence', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='France'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Pays cible
                </label>
                <input
                  type='text'
                  value={data.targetCountry}
                  onChange={e => handleChange('targetCountry', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Pays souhaité'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Ville cible
                </label>
                <input
                  type='text'
                  value={data.targetCity}
                  onChange={e => handleChange('targetCity', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                  placeholder='Ville souhaitée'
                />
              </div>
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
              >
                <Save className='h-4 w-4 mr-2' />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>

        {/* Budget */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>Budget</h2>
            <p className='text-gray-600'>
              Informations sur votre budget mensuel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Wallet className='h-4 w-4 inline mr-1' />
                Budget mensuel
              </label>
              <input
                type='text'
                value={data.monthlyBudget}
                onChange={e => handleChange('monthlyBudget', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)]'
                placeholder='Ex: 500-1000€'
              />
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
              >
                <Save className='h-4 w-4 mr-2' />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);

ProfileSettings.displayName = 'ProfileSettings';

export default ProfileSettings;
