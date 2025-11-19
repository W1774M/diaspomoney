'use client';

import type { BillingSettingsProps } from '@/lib/types';
import { CreditCard, Save } from 'lucide-react';
import React, { useCallback } from 'react';

const BillingSettings = React.memo<BillingSettingsProps>(
  function BillingSettings({ data, setData, onSave, saving }) {
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

    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>
            Informations de facturation
          </h2>
          <p className='text-gray-600'>
            Gérez vos méthodes de paiement et informations de facturation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Méthode de paiement
              </label>
              <div className='relative'>
                <CreditCard className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <select
                  value={data.paymentMethod}
                  title='Méthode de paiement'
                  onChange={e => handleChange('paymentMethod', e.target.value)}
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Sélectionner une méthode</option>
                  <option value='card'>Carte bancaire</option>
                  <option value='paypal'>PayPal</option>
                  <option value='bank_transfer'>Virement bancaire</option>
                  <option value='check'>Chèque</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Adresse de facturation
              </label>
              <textarea
                value={data.billingAddress}
                onChange={e => handleChange('billingAddress', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Votre adresse de facturation'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Numéro de TVA / SIRET
              </label>
              <input
                type='text'
                value={data.taxId}
                onChange={e => handleChange('taxId', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='FR12345678901'
              />
            </div>
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-md font-medium text-gray-900 mb-4'>
              Historique des paiements
            </h3>
            <div className='bg-gray-50 rounded-lg p-4'>
              <p className='text-sm text-gray-600 text-center'>
                Aucun paiement enregistré pour le moment.
              </p>
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
  },
);

BillingSettings.displayName = 'BillingSettings';

export default BillingSettings;
