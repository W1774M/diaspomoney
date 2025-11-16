'use client';

import { PrivacySettingsProps } from '@/types/settings';
import { Save, Shield, Users } from 'lucide-react';
import React, { useCallback } from 'react';

const PrivacySettings = React.memo<PrivacySettingsProps>(
  function PrivacySettings({ data, setData, onSave, saving }) {
    const handleChange = useCallback(
      (field: keyof typeof data, value: string | boolean) => {
        setData({ ...data, [field]: value });
      },
      [data, setData]
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
      },
      [onSave]
    );

    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>
            Paramètres de confidentialité
          </h2>
          <p className='text-gray-600'>
            Contrôlez qui peut voir vos informations et comment vos données sont
            utilisées.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Visibilité du profil
              </label>
              <div className='relative'>
                <Users className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <select
                  value={data.profileVisibility}
                  onChange={e =>
                    handleChange('profileVisibility', e.target.value)
                  }
                  aria-label='Visibilité du profil'
                  title='Visibilité du profil'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='public'>Public</option>
                  <option value='friends'>Amis seulement</option>
                  <option value='private'>Privé</option>
                </select>
              </div>
              <p className='text-sm text-gray-500 mt-1'>
                Détermine qui peut voir votre profil et vos informations
                publiques.
              </p>
            </div>
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-md font-medium text-gray-900 mb-4'>
              Partage de données
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Shield className='h-5 w-5 text-gray-400 mr-3' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Partage de données avec des partenaires
                    </p>
                    <p className='text-sm text-gray-600'>
                      Autoriser le partage de données anonymisées avec nos
                      partenaires
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={data.dataSharing}
                    onChange={e =>
                      handleChange('dataSharing', e.target.checked)
                    }
                    aria-label='Partage de données avec des partenaires'
                    title='Partage de données avec des partenaires'
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Shield className='h-5 w-5 text-gray-400 mr-3' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Analytics et amélioration du service
                    </p>
                    <p className='text-sm text-gray-600'>
                      Autoriser l&apos;utilisation de vos données pour améliorer
                      nos services
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={data.analytics}
                    onChange={e => handleChange('analytics', e.target.checked)}
                    aria-label='Analytics et amélioration du service'
                    title='Analytics et amélioration du service'
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-md font-medium text-gray-900 mb-4'>
              Consentements
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Shield className='h-5 w-5 text-gray-400 mr-3' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Consentement marketing
                    </p>
                    <p className='text-sm text-gray-600'>
                      J&apos;accepte de recevoir des communications marketing
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={data.marketingConsent || false}
                    onChange={e =>
                      handleChange('marketingConsent', e.target.checked)
                    }
                    aria-label='Consentement marketing'
                    title='Consentement marketing'
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Shield className='h-5 w-5 text-gray-400 mr-3' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Consentement KYC
                    </p>
                    <p className='text-sm text-gray-600'>
                      J&apos;accepte le processus de vérification
                      d&apos;identité (KYC)
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={data.kycConsent || false}
                    onChange={e => handleChange('kycConsent', e.target.checked)}
                    aria-label='Consentement KYC'
                    title='Consentement KYC'
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-md font-medium text-gray-900 mb-4'>
              Gestion des données
            </h3>
            <div className='space-y-3'>
              <button
                type='button'
                className='w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <p className='text-sm font-medium text-gray-900'>
                  Télécharger mes données
                </p>
                <p className='text-sm text-gray-600'>
                  Obtenir une copie de toutes vos données
                </p>
              </button>

              <button
                type='button'
                className='w-full text-left px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors'
              >
                <p className='text-sm font-medium text-red-900'>
                  Supprimer mon compte
                </p>
                <p className='text-sm text-red-600'>
                  Supprimer définitivement votre compte et toutes vos données
                </p>
              </button>
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
    );
  }
);

PrivacySettings.displayName = 'PrivacySettings';

export default PrivacySettings;
