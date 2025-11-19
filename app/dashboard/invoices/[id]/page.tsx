'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useInvoice, useInvoiceActions } from '@/hooks/invoices';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusColor,
} from '@/lib/invoices/utils';
import { INVOICE_STATUSES } from '@/types';
import { ArrowLeft, Download, Edit, Mail, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Page de détail d'une facture
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useInvoice, useInvoiceActions)
 * - Service Layer Pattern (via les hooks qui appellent les API)
 * - Logger Pattern (structured logging côté serveur via les API routes)
 * - Error Handling Pattern (gestion d'erreurs via les hooks et notifications)
 */
export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = (params?.id as string) || '';
  const { isAdmin } = useAuth();

  // Utiliser le Custom Hook Pattern
  const { invoice, loading, error } = useInvoice(invoiceId);
  const { downloadInvoice, sendInvoiceByEmail, isDownloading, isSending } =
    useInvoiceActions();

  const handleDownload = () => {
    if (invoice?._id) {
      downloadInvoice(invoice._id || invoiceId);
    }
  };

  const handlePrint = () => {
    // Impression native du navigateur
    window.print();
  };

  const handleSendEmail = () => {
    if (invoice?._id) {
      sendInvoiceByEmail(invoice._id || invoiceId);
    }
  };

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>Chargement de la facture...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600 mb-4'>{error || 'Facture non trouvée'}</p>
        <Link
          href='/dashboard/invoices'
          className='mt-4 inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Retour aux factures
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <Link
            href='/dashboard/invoices'
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour aux factures
          </Link>
          <div className='flex space-x-2'>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className='flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Download className='h-4 w-4 mr-2' />
              {isDownloading ? 'Téléchargement...' : 'Télécharger'}
            </button>
            <button
              onClick={handlePrint}
              className='flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
            >
              <Printer className='h-4 w-4 mr-2' />
              Imprimer
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className='flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Mail className='h-4 w-4 mr-2' />
              {isSending ? 'Envoi...' : 'Envoyer'}
            </button>
            {isAdmin() && (
              <Link
                href={`/dashboard/invoices/${invoice._id}/edit`}
                className='flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
              >
                <Edit className='h-4 w-4 mr-2' />
                Modifier
              </Link>
            )}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Facture {invoice.invoiceNumber}
            </h1>
            <p className='text-gray-600 mt-2'>
              Créée le {formatDate(invoice.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getInvoiceStatusColor(
              invoice.status,
            )}`}
          >
            {(() => {
              const found = INVOICE_STATUSES.find(
                s => s.valueOf() === invoice.status,
              );
              return typeof found === 'string'
                ? found
                : (found as unknown as string)?.toString();
            })()}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Informations principales */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Détails de la facture */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Détails de la facture
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Numéro de facture
                </label>
                <p className='text-gray-900 font-medium'>
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusColor(
                    invoice.status,
                  )}`}
                >
                  {invoice.status}
                </span>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Date d&apos;émission
                </label>
                <p className='text-gray-900'>{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Date d&apos;échéance
                </label>
                <p className='text-gray-900'>{formatDate(invoice.dueDate)}</p>
              </div>
              {invoice.paidDate && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date de paiement
                  </label>
                  <p className='text-gray-900'>
                    {formatDate(invoice.paidDate)}
                  </p>
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Devise
                </label>
                <p className='text-gray-900'>{invoice.currency}</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Articles
            </h2>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Description
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Quantité
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Prix unitaire
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {item.description}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                        {item.quantity}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right'>
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right'>
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className='mt-6 border-t border-gray-200 pt-4'>
              <div className='flex justify-end'>
                <div className='text-right'>
                  <div className='text-lg font-semibold text-gray-900'>
                    Total: {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Notes
              </h2>
              <p className='text-gray-700'>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Informations client/prestataire */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations
            </h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Client ID
                </label>
                <p className='text-gray-900'>{invoice.customerId}</p>
              </div>
              {invoice.providerId && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Prestataire ID
                  </label>
                  <p className='text-gray-900'>{invoice.providerId}</p>
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Créé par
                </label>
                <p className='text-gray-900'>{invoice.userId}</p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Actions rapides
            </h2>
            <div className='space-y-2'>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Download className='h-4 w-4 mr-2' />
                {isDownloading ? 'Téléchargement...' : 'Télécharger PDF'}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className='w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Mail className='h-4 w-4 mr-2' />
                {isSending ? 'Envoi...' : 'Envoyer par email'}
              </button>
              <button
                onClick={handlePrint}
                className='w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
              >
                <Printer className='h-4 w-4 mr-2' />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
