/**
 * Page de création d'une nouvelle adresse de facturation
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useBillingAddressCreate)
 * - Error Handling Pattern (Sentry côté client)
 * - Component Composition Pattern (sous-composants)
 */

'use client';

import type { BillingAddressFormData } from '@/hooks/payments/useBillingAddressCreate';
import { useBillingAddressCreate } from '@/hooks/payments/useBillingAddressCreate';
import { ArrowLeft, Building, Home, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewAddressPage() {
  const router = useRouter();
  const { createAddress, loading: saving } = useBillingAddressCreate();
  const [formData, setFormData] = useState<BillingAddressFormData>({
    name: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'France',
    phone: '',
    isDefault: false,
    type: 'home',
  });

  const handleInputChange = (
    field: keyof BillingAddressFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const address = await createAddress(formData);

    if (address) {
      router.push('/dashboard/payments');
    }
  };

  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'CA', name: 'Canada' },
    { code: 'US', name: 'États-Unis' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'IT', name: 'Italie' },
    { code: 'ES', name: 'Espagne' },
    { code: 'NL', name: 'Pays-Bas' },
  ];

  const addressTypes = [
    { value: 'home' as const, label: 'Domicile', icon: Home },
    { value: 'work' as const, label: 'Travail', icon: Building },
    { value: 'other' as const, label: 'Autre', icon: MapPin },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <Link
                href='/dashboard/payments'
                className='flex items-center text-gray-500 hover:text-gray-700 mr-4'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Retour aux moyens de paiement
              </Link>
              <h1 className='text-2xl font-bold text-gray-900'>
                Ajouter une adresse de facturation
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow border border-gray-200'>
          <div className='p-6'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Type d'adresse */}
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Type d'adresse
                </h2>
                <div className='grid grid-cols-3 gap-4'>
                  {addressTypes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => handleInputChange('type', value)}
                      className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                        formData.type === value
                          ? 'border-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 mb-2 ${
                          formData.type === value
                            ? 'text-[hsl(25,100%,53%)]'
                            : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          formData.type === value
                            ? 'text-[hsl(25,100%,53%)]'
                            : 'text-gray-700'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informations de l'adresse */}
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Informations de l'adresse
                </h2>

                <div className='space-y-4'>
                  {/* Nom de l'adresse */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nom de l'adresse *
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='Ex: Adresse principale, Bureau, etc.'
                      required
                    />
                  </div>

                  {/* Adresse principale */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Adresse *
                    </label>
                    <input
                      type='text'
                      value={formData.address}
                      onChange={e =>
                        handleInputChange('address', e.target.value)
                      }
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='123 Rue de la Paix'
                      required
                    />
                  </div>

                  {/* Adresse complémentaire */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Complément d'adresse
                    </label>
                    <input
                      type='text'
                      value={formData.address2 || ''}
                      onChange={e =>
                        handleInputChange('address2', e.target.value)
                      }
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='Appartement, bureau, etc. (optionnel)'
                    />
                  </div>

                  {/* Ville et État/Région */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Ville *
                      </label>
                      <input
                        type='text'
                        value={formData.city}
                        onChange={e =>
                          handleInputChange('city', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                        placeholder='Paris'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        État/Région
                      </label>
                      <input
                        type='text'
                        value={formData.state || ''}
                        onChange={e =>
                          handleInputChange('state', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                        placeholder='Île-de-France'
                      />
                    </div>
                  </div>

                  {/* Code postal et Pays */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Code postal *
                      </label>
                      <input
                        type='text'
                        value={formData.postalCode}
                        onChange={e =>
                          handleInputChange('postalCode', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                        placeholder='75001'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Pays *
                      </label>
                      <select
                        title='Pays'
                        value={formData.country}
                        onChange={e =>
                          handleInputChange('country', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                        required
                      >
                        {countries.map(country => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Téléphone
                    </label>
                    <input
                      type='tel'
                      value={formData.phone || ''}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='+33 1 23 45 67 89'
                    />
                  </div>

                  {/* Adresse par défaut */}
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='isDefault'
                      checked={formData.isDefault}
                      onChange={e =>
                        handleInputChange('isDefault', e.target.checked)
                      }
                      className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                    />
                    <label
                      htmlFor='isDefault'
                      className='ml-2 text-sm text-gray-700'
                    >
                      Définir comme adresse de facturation par défaut
                    </label>
                  </div>
                </div>
              </div>

              {/* Aperçu de l'adresse */}
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Aperçu de l'adresse
                </h3>
                <div className='space-y-2 text-gray-700'>
                  <div className='font-medium'>
                    {formData.name || "Nom de l'adresse"}
                  </div>
                  <div>{formData.address || 'Adresse'}</div>
                  {formData.address2 && <div>{formData.address2}</div>}
                  <div>
                    {formData.postalCode &&
                      formData.city &&
                      `${formData.postalCode} ${formData.city}`}
                    {formData.state && `, ${formData.state}`}
                  </div>
                  <div>{formData.country}</div>
                  {formData.phone && (
                    <div className='text-sm text-gray-500'>
                      {formData.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Sécurité */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-start'>
                  <Shield className='h-5 w-5 text-blue-600 mt-0.5 mr-3' />
                  <div>
                    <h3 className='text-sm font-medium text-blue-900'>
                      Protection des données
                    </h3>
                    <p className='text-sm text-blue-700 mt-1'>
                      Votre adresse est utilisée uniquement pour la facturation
                      et n'est jamais partagée avec des tiers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex justify-end space-x-4 pt-6 border-t border-gray-200'>
                <Link
                  href='/dashboard/payments'
                  className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Annuler
                </Link>
                <button
                  type='submit'
                  disabled={
                    saving ||
                    !formData.name ||
                    !formData.address ||
                    !formData.city ||
                    !formData.postalCode ||
                    !formData.country
                  }
                  className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {saving ? 'Ajout en cours...' : "Ajouter l'adresse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
