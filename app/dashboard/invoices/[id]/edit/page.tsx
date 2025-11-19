'use client';

/**
 * Page d'édition d'une facture
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useInvoice, useInvoiceEdit, useInvoiceUsers)
 * - Service Layer Pattern (via les API routes qui utilisent InvoiceService)
 * - Decorator Pattern (via InvoiceService.updateInvoice avec @InvalidateCache, @Log)
 */

import { useAuth } from '@/hooks/auth/useAuth';
import { useInvoice, useInvoiceEdit, useInvoiceUsers } from '@/hooks/invoices';
import { IInvoice, INVOICE_STATUSES, InvoiceStatus } from '@/lib/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = (params?.id as string) || null;
  const router = useRouter();
  const { isAdmin, isAuthenticated, isLoading, status, user } = useAuth();

  // Custom Hooks Pattern
  const {
    invoice,
    loading: invoiceLoading,
    error: invoiceError,
  } = useInvoice(invoiceId);
  const { updateInvoice, saving, error: updateError } = useInvoiceEdit();
  const { customers, providers, loading: usersLoading } = useInvoiceUsers();

  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    customerId: string;
    providerId: string;
    currency: string;
    status: InvoiceStatus;
    issueDate: string;
    dueDate: string;
    paidDate: string;
    notes: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  }>({
    invoiceNumber: '',
    customerId: '',
    providerId: '',
    currency: 'EUR',
    status: InvoiceStatus.DRAFT,
    issueDate: '',
    dueDate: '',
    paidDate: '',
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

  // Remplir le formulaire avec les données de la facture
  useEffect(() => {
    if (invoice) {
      const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        const dateStr = date.toISOString().split('T')[0];
        return dateStr || '';
      };

      setFormData({
        invoiceNumber: invoice.invoiceNumber ?? '',
        customerId: invoice.customerId ?? '',
        providerId: invoice.providerId ?? '',
        currency: invoice.currency ?? 'EUR',
        status: (invoice.status as InvoiceStatus) ?? InvoiceStatus.DRAFT,
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        paidDate: formatDate(invoice.paidDate || invoice.paymentDate),
        notes: invoice.notes ?? '',
        items:
          invoice.items && invoice.items.length > 0
            ? invoice.items
            : [
                {
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                  total: 0,
                },
              ],
      });
    }
  }, [invoice]);

  const handleInputChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  type ItemField = keyof (typeof formData.items)[number];

  const handleItemChange = (
    index: number,
    field: ItemField,
    value: (typeof formData.items)[number][ItemField],
  ) => {
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

    if (!invoiceId || !user?.id) {
      return;
    }

    try {
      const updatedInvoice: Partial<IInvoice> = {
        invoiceNumber: formData.invoiceNumber,
        customerId: formData.customerId,
        ...(formData.providerId && { providerId: formData.providerId }),
        currency: formData.currency,
        status: formData.status,
        notes: formData.notes,
        items: formData.items,
        amount: calculateTotal(),
        userId: user.id,
        ...(formData.issueDate && { issueDate: new Date(formData.issueDate) }),
        ...(formData.dueDate && { dueDate: new Date(formData.dueDate) }),
        ...(formData.paidDate && { paidDate: new Date(formData.paidDate) }),
      };

      // Utiliser le Custom Hook Pattern (qui utilise l'API route avec InvoiceService et decorators)
      await updateInvoice(invoiceId, updatedInvoice);

      // Rediriger vers la page de détail
      router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (_error) {
      // L'erreur est déjà gérée par le hook useInvoiceEdit
      // On peut afficher un message d'erreur si nécessaire
    }
  };

  // Vérifier l'authentification et les permissions
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !isLoading && !isAdmin()) {
      router.push('/dashboard/invoices');
    }
  }, [status, isLoading, isAdmin, router]);

  // Afficher un message de chargement
  if (isLoading || invoiceLoading || usersLoading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>Chargement...</p>
      </div>
    );
  }

  // Redirection en cours
  if (!isAuthenticated) {
    return null;
  }

  // Accès non autorisé
  if (!isAdmin()) {
    return (
      <div className='text-center py-12'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto'>
          <h2 className='text-lg font-semibold text-red-800 mb-2'>
            Accès non autorisé
          </h2>
          <p className='text-red-600 mb-4'>
            Cette page est réservée aux administrateurs uniquement.
          </p>
          <button
            onClick={() => router.push('/dashboard/invoices')}
            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
          >
            Retour aux factures
          </button>
        </div>
      </div>
    );
  }

  // Erreur de chargement
  if (invoiceError || !invoice) {
    return (
      <div className='text-center py-12'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto'>
          <h2 className='text-lg font-semibold text-red-800 mb-2'>
            Erreur de chargement
          </h2>
          <p className='text-red-600 mb-4'>
            {invoiceError || 'Facture non trouvée'}
          </p>
          <Link
            href='/dashboard/invoices'
            className='inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
          >
            Retour aux factures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour à la facture
          </Link>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Modifier la Facture
        </h1>
        <p className='text-gray-600 mt-2'>
          Modifiez les informations de la facture {formData.invoiceNumber}
        </p>
      </div>

      {/* Message d'erreur de mise à jour */}
      {updateError && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{updateError}</p>
        </div>
      )}

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
                <option value=''>Sélectionner un client</option>
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
                <option value=''>Sélectionner un prestataire</option>
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
                onChange={e =>
                  handleInputChange('status', e.target.value as InvoiceStatus)
                }
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

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Date de paiement
              </label>
              <input
                type='date'
                title='Date de paiement'
                value={formData.paidDate}
                onChange={e => handleInputChange('paidDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
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
                          parseInt(e.target.value) || 1,
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
                          parseFloat(e.target.value) || 0,
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
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: formData.currency,
                        }).format(item.total)}
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
                  Total:{' '}
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: formData.currency,
                  }).format(calculateTotal())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end space-x-4'>
          <Link
            href={`/dashboard/invoices/${invoiceId}`}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Annuler
          </Link>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </>
  );
}
