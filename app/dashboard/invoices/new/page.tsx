'use client';

import { useInvoiceCreate, useInvoiceUsers } from '@/hooks/invoices';
import { formatCurrency } from '@/lib/invoices/utils';
import { IInvoice, INVOICE_STATUSES, InvoiceStatus } from '@/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Page de création d'une nouvelle facture
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useInvoiceCreate, useInvoiceUsers, useAuth)
 * - Service Layer Pattern (via les hooks qui appellent les API)
 * - Logger Pattern (structured logging côté serveur via les API routes)
 * - Error Handling Pattern (gestion d'erreurs via les hooks et notifications)
 */
export default function NewInvoicePage() {
  const router = useRouter();
  const { createInvoice, creating } = useInvoiceCreate();
  const { customers, providers, loading: usersLoading } = useInvoiceUsers();
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerId: '',
    providerId: '',
    currency: 'EUR',
    status: 'DRAFT' as InvoiceStatus,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    notes: '',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const currentItem = newItems[index];
    if (!currentItem) return;

    newItems[index] = {
      description: currentItem.description,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      total: currentItem.total,
      [field]: value,
    };

    // Calculer le total automatiquement
    if (field === 'quantity' || field === 'unitPrice') {
      const updatedItem = newItems[index];
      if (updatedItem) {
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
      }
    }

    setFormData(prev => ({
      ...prev,
      items: newItems,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider que tous les items
    const validItems = formData.items.filter(
      item => item.description && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      return;
    }

    const newInvoice: Partial<IInvoice> = {
      ...(formData.invoiceNumber && { invoiceNumber: formData.invoiceNumber }), // Le service génère automatiquement si vide
      customerId: formData.customerId,
      ...(formData.providerId && { providerId: formData.providerId }),
      currency: formData.currency,
      status: formData.status,
      ...(formData.notes && { notes: formData.notes }),
      items: validItems,
      ...(formData.issueDate && { issueDate: new Date(formData.issueDate) }),
      ...(formData.dueDate && { dueDate: new Date(formData.dueDate) }),
    };

    const createdInvoice = await createInvoice(newInvoice);

    if (createdInvoice) {
      router.push(`/dashboard/invoices/${createdInvoice._id}`);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <Link
            href='/dashboard/invoices'
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour aux factures
          </Link>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>Nouvelle Facture</h1>
        <p className='text-gray-600 mt-2'>
          Créez une nouvelle facture pour vos clients
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Informations générales */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Informations générales
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Numéro de facture
              </label>
              <input
                type='text'
                value={formData.invoiceNumber}
                onChange={e =>
                  handleInputChange('invoiceNumber', e.target.value)
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='FACT-2024-001'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Client
              </label>
              <select
                title='Client'
                value={formData.customerId}
                onChange={e => handleInputChange('customerId', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                required
                disabled={usersLoading}
              >
                <option value=''>
                  {usersLoading ? 'Chargement...' : 'Sélectionner un client'}
                </option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Prestataire
              </label>
              <select
                title='Prestataire'
                value={formData.providerId}
                onChange={e => handleInputChange('providerId', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                disabled={usersLoading}
              >
                <option value=''>
                  {usersLoading
                    ? 'Chargement...'
                    : 'Sélectionner un prestataire'}
                </option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Devise
              </label>
              <select
                title='Devise'
                value={formData.currency}
                onChange={e => handleInputChange('currency', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='EUR'>EUR (€)</option>
                <option value='USD'>USD ($)</option>
                <option value='GBP'>GBP (£)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Statut
              </label>
              <select
                title='Statut'
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                {INVOICE_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Date d&apos;émission
              </label>
              <input
                type='date'
                title="Date d'émission"
                value={formData.issueDate}
                onChange={e => handleInputChange('issueDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Date d&apos;échéance
              </label>
              <input
                type='date'
                title="Date d'échéance"
                value={formData.dueDate}
                onChange={e => handleInputChange('dueDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                required
              />
            </div>
          </div>

          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Notes
            </label>
            <textarea
              title='Notes'
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              placeholder='Notes additionnelles...'
            />
          </div>
        </div>

        {/* Articles */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>Articles</h2>
            <button
              type='button'
              onClick={addItem}
              className='flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
            >
              <Plus className='h-4 w-4 mr-2' />
              Ajouter un article
            </button>
          </div>

          <div className='space-y-4'>
            {formData.items.map((item, index) => (
              <div
                key={index}
                className='border border-gray-200 rounded-lg p-4'
              >
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <input
                      type='text'
                      title='Description'
                      value={item.description}
                      onChange={e =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder="Description de l'article"
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Quantité
                    </label>
                    <input
                      type='number'
                      min='1'
                      title='Quantité'
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseInt(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Prix unitaire
                    </label>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      title='Prix unitaire'
                      value={item.unitPrice}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'unitPrice',
                          parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      required
                    />
                  </div>

                  <div className='flex items-end'>
                    <div className='flex-1'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Total
                      </label>
                      <div className='px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900'>
                        {formatCurrency(item.total, formData.currency)}
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeItem(index)}
                        className='ml-2 p-2 text-red-600 hover:text-red-900'
                        title="Supprimer l'article"
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className='mt-6 border-t border-gray-200 pt-4'>
            <div className='flex justify-end'>
              <div className='text-right'>
                <div className='text-lg font-semibold text-gray-900'>
                  Total: {formatCurrency(calculateTotal(), formData.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end space-x-4'>
          <Link
            href='/dashboard/invoices'
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Annuler
          </Link>
          <button
            type='submit'
            disabled={creating || usersLoading}
            className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {creating ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </form>
    </>
  );
}
