"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { IInvoice, INVOICE_STATUSES } from "@/types";
import { ArrowLeft, Download, Edit, Mail, Printer } from "lucide-react";
import Link from "next/link";
// import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvoiceDetailPage() {
  // const params = useParams();
  const invoiceId = "temp-invoice-id"; // TODO: Get from URL params
  // const router = useRouter();
  const { isAdmin } = useAuth();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Simuler des données pour l'exemple
  useEffect(() => {
    const mockInvoice: IInvoice = {
      _id: (Array.isArray(invoiceId) ? invoiceId[0] : invoiceId) || "",
      invoiceNumber: "FACT-2024-001",
      customerId: "1",
      providerId: "4",
      amount: 2500.0,
      currency: "EUR",
      status: "PAID",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      paidDate: new Date("2024-02-10"),
      items: [
        {
          description: "Design UI/UX",
          quantity: 1,
          unitPrice: 1500,
          total: 1500,
        },
        {
          description: "Développement frontend",
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
      notes: "Facture payée avec succès",
      userId: "user1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    };
    setInvoice(mockInvoice);
    setLoading(false);
  }, [invoiceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleDownload = () => {
    console.log("Téléchargement de la facture:", invoice?.invoiceNumber);
    alert(`Téléchargement de la facture ${invoice?.invoiceNumber}`);
  };

  const handlePrint = () => {
    console.log("Impression de la facture:", invoice?.invoiceNumber);
    window.print();
  };

  const handleSendEmail = () => {
    console.log("Envoi par email:", invoice?.invoiceNumber);
    alert(`Facture ${invoice?.invoiceNumber} envoyée par email`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de la facture...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Facture non trouvée</p>
        <Link
          href="/dashboard/invoices"
          className="mt-4 inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux factures
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard/invoices"
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux factures
          </Link>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </button>
            <button
              onClick={handleSendEmail}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer
            </button>
            {isAdmin() && (
              <Link
                href={`/dashboard/invoices/${invoice._id}/edit`}
                className="flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Facture {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600 mt-2">
              Créée le {formatDate(invoice.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              invoice.status
            )}`}
          >
            {INVOICE_STATUSES.find(s => s.value === invoice.status)?.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la facture */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Détails de la facture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de facture
                </label>
                <p className="text-gray-900 font-medium">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {
                    INVOICE_STATUSES.find(s => s.value === invoice.status)
                      ?.label
                  }
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d&apos;émission
                </label>
                <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d&apos;échéance
                </label>
                <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              {invoice.paidDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement
                  </label>
                  <p className="text-gray-900">
                    {formatDate(invoice.paidDate)}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <p className="text-gray-900">{invoice.currency}</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Articles
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    Total: {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notes
              </h2>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations client/prestataire */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <p className="text-gray-900">{invoice.customerId}</p>
              </div>
              {invoice.providerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prestataire ID
                  </label>
                  <p className="text-gray-900">{invoice.providerId}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créé par
                </label>
                <p className="text-gray-900">{invoice.userId}</p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
