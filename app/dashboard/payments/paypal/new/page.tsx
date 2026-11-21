/**
 * Page de création d'un nouveau compte PayPal
 * Implémente les design patterns :
 * - Custom Hooks Pattern (usePaymentMethodCreate)
 * - Error Handling Pattern (Sentry côté client)
 * - Component Composition Pattern (sous-composants)
 */

'use client';

import type { PayPalFormData } from '@/hooks/payments/usePaymentMethodCreate';
import { usePaymentMethodCreate } from '@/hooks/payments/usePaymentMethodCreate';
import { ArrowLeft, CreditCard, Eye, EyeOff, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewPayPalPage() {
  const router = useRouter();
  const { createPayPal, loading: saving } = usePaymentMethodCreate();
  const [formData, setFormData] = useState<PayPalFormData>({
    email: '',
    password: '',
    isDefault: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (
    field: keyof PayPalFormData,
    value: string | boolean,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = await createPayPal(formData);

    if (method) {
      router.push('/dashboard/payments');
    }
  };

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
                Ajouter un compte PayPal
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow border border-gray-200'>
          <div className='p-6'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Informations PayPal */}
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Informations du compte PayPal
                </h2>

                <div className='space-y-4'>
                  {/* Email */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Adresse email PayPal *
                    </label>
                    <div className='relative'>
                      <input
                        type='email'
                        value={formData.email}
                        onChange={e =>
                          handleInputChange('email', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent pr-12'
                        placeholder='votre-email@example.com'
                        required
                      />
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                        <Mail className='h-5 w-5 text-gray-400' />
                      </div>
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Mot de passe PayPal *
                    </label>
                    <div className='relative'>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e =>
                          handleInputChange('password', e.target.value)
                        }
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent pr-12'
                        placeholder='Votre mot de passe PayPal'
                        required
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute inset-y-0 right-0 flex items-center pr-3'
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400' />
                        )}
                      </button>
                    </div>
                    <p className='text-sm text-gray-500 mt-1'>
                      Nous utiliserons ces informations pour vous connecter à
                      PayPal lors des paiements.
                    </p>
                  </div>

                  {/* Compte par défaut */}
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
                      Définir comme moyen de paiement par défaut
                    </label>
                  </div>
                </div>
              </div>

              {/* Aperçu PayPal */}
              <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white'>
                <div className='flex items-center justify-between mb-4'>
                  <CreditCard className='h-8 w-8' />
                  <span className='text-sm opacity-75'>PayPal</span>
                </div>
                <div className='mb-4'>
                  <div className='text-lg font-medium mb-2'>
                    {formData.email || 'votre-email@example.com'}
                  </div>
                  <div className='text-sm opacity-75'>
                    Compte PayPal sécurisé
                  </div>
                </div>
              </div>

              {/* Avantages PayPal */}
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <h3 className='text-sm font-medium text-green-900 mb-2'>
                  Avantages de PayPal
                </h3>
                <ul className='text-sm text-green-700 space-y-1'>
                  <li>• Paiements rapides et sécurisés</li>
                  <li>• Protection de l'acheteur</li>
                  <li>• Pas besoin de saisir vos informations de carte</li>
                  <li>• Paiements en plusieurs fois disponibles</li>
                </ul>
              </div>

              {/* Sécurité */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-start'>
                  <Shield className='h-5 w-5 text-blue-600 mt-0.5 mr-3' />
                  <div>
                    <h3 className='text-sm font-medium text-blue-900'>
                      Sécurité garantie
                    </h3>
                    <p className='text-sm text-blue-700 mt-1'>
                      Vos informations PayPal sont chiffrées et sécurisées. Nous
                      utilisons les mêmes standards de sécurité que PayPal.
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
                  disabled={saving || !formData.email || !formData.password}
                  className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {saving ? 'Ajout en cours...' : 'Ajouter PayPal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
