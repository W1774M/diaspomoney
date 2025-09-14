"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { IInvoice, InvoiceStatus } from "@/types";
import { Edit, Eye, FileText, Plus, Search, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvoicesPage() {
  const {
    user,
    isAdmin,
    isProvider,
    isCustomer,
    isCSM,
    isAuthenticated,
    isLoading,
    status,
  } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">(
    "ALL"
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "as-provider" | "as-customer"
  >("all");

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]); // Utiliser seulement le status de la session

  // Simuler des données pour l'exemple
  useEffect(() => {
    if (isAuthenticated) {
      const mockInvoices: IInvoice[] = [
        {
          _id: "1",
          invoiceNumber: "FACT-2024-001",
          customerId: "customer-1",
          providerId: "provider-1",
          amount: 1500,
          currency: "EUR",
          status: "PAID",
          issueDate: new Date("2024-01-15"),
          dueDate: new Date("2024-02-15"),
          paidDate: new Date("2024-01-20"),
          items: [
            {
              description: "Consultation cardiologie",
              quantity: 1,
              unitPrice: 150,
              total: 150,
            },
            {
              description: "Échographie cardiaque",
              quantity: 1,
              unitPrice: 200,
              total: 200,
            },
          ],
          notes: "Facture pour consultation médicale",
          userId: "admin-1",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-20"),
        },
        {
          _id: "2",
          invoiceNumber: "FACT-2024-002",
          customerId: "customer-2",
          providerId: "provider-2",
          amount: 2500,
          currency: "EUR",
          status: "SENT",
          issueDate: new Date("2024-01-20"),
          dueDate: new Date("2024-02-20"),
          items: [
            {
              description: "Rénovation cuisine",
              quantity: 1,
              unitPrice: 2500,
              total: 2500,
            },
          ],
          notes: "Facture pour travaux de rénovation",
          userId: "admin-1",
          createdAt: new Date("2024-01-20"),
          updatedAt: new Date("2024-01-20"),
        },
        {
          _id: "3",
          invoiceNumber: "FACT-2024-003",
          customerId: "hybrid-1",
          providerId: "provider-1",
          amount: 120,
          currency: "EUR",
          status: "DRAFT",
          issueDate: new Date("2024-01-25"),
          dueDate: new Date("2024-02-25"),
          items: [
            {
              description: "Transport médical",
              quantity: 1,
              unitPrice: 120,
              total: 120,
            },
          ],
          notes: "Facture pour transport médical",
          userId: "admin-1",
          createdAt: new Date("2024-01-25"),
          updatedAt: new Date("2024-01-25"),
        },
      ];

      // Filtrer les factures selon le rôle de l'utilisateur
      let filteredInvoices = mockInvoices;

      if (isAdmin() || isCSM()) {
        // Les admins et CSM voient toutes les factures
        filteredInvoices = mockInvoices;
      } else if (isProvider() && isCustomer()) {
        // Utilisateur hybride (prestataire + client) - on garde toutes les factures pour le filtrage par onglets
        filteredInvoices = mockInvoices;
      } else if (isProvider()) {
        // Les prestataires voient leurs propres factures
        filteredInvoices = mockInvoices.filter(
          invoice => invoice.providerId === user?.id
        );
      } else if (isCustomer()) {
        // Les clients voient leurs propres factures
        filteredInvoices = mockInvoices.filter(
          invoice => invoice.customerId === user?.id
        );
      }

      setInvoices(filteredInvoices);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Utiliser seulement les valeurs stables

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;

    // Filtrage par onglets pour les utilisateurs hybrides
    let matchesTab = true;
    if (isProvider() && isCustomer() && !isAdmin()) {
      if (activeTab === "as-provider") {
        // Factures où l'utilisateur est le prestataire
        matchesTab = invoice.providerId === user?.id;
      } else if (activeTab === "as-customer") {
        // Factures où l'utilisateur est le client
        matchesTab = invoice.customerId === user?.id;
      }
      // activeTab === "all" affiche toutes les factures
    }

    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      setInvoices(invoices.filter(invoice => invoice._id !== id));
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
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
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Redirection en cours
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des factures...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isAdmin() || isCSM() ? "Toutes les factures" : "Mes factures"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin() || isCSM()
              ? "Gérez toutes les factures de la plateforme"
              : "Gérez vos factures et suivez leur statut"}
          </p>
        </div>
        {(isAdmin() || isCSM()) && (
          <div className="mt-4 sm:mt-0">
            <Link
              href="/invoices/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle facture
            </Link>
          </div>
        )}
      </div>

      {/* Onglets pour utilisateurs hybrides */}
      {isProvider() && isCustomer() && !isAdmin() && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-[hsl(25,100%,53%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Toutes mes factures
            </button>
            <button
              onClick={() => setActiveTab("as-provider")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "as-provider"
                  ? "bg-[hsl(25,100%,53%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              En tant que prestataire
            </button>
            <button
              onClick={() => setActiveTab("as-customer")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "as-customer"
                  ? "bg-[hsl(25,100%,53%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              En tant que client
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as InvoiceStatus | "ALL")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="SENT">Envoyée</option>
            <option value="PAID">Payée</option>
            <option value="OVERDUE">En retard</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-500 flex items-center justify-center sm:justify-start">
          {filteredInvoices.length} facture
          {filteredInvoices.length > 1 ? "s" : ""} trouvée
          {filteredInvoices.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredInvoices.map(invoice => (
          <div
            key={invoice._id}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Émise le {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.amount)}
                </span>
                <span className="text-sm text-gray-500">
                  {invoice.currency}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Notes */}
              {invoice.notes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {invoice.notes}
                </div>
              )}

              {/* Dates */}
              <div className="text-sm text-gray-500 space-y-1">
                <p>Échéance: {formatDate(invoice.dueDate)}</p>
                {invoice.paidDate && (
                  <p>Payée le: {formatDate(invoice.paidDate)}</p>
                )}
              </div>

              {/* Items count */}
              <div className="text-sm text-gray-500">
                {invoice.items.length} article
                {invoice.items.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-4 sm:px-6 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/invoices/${invoice._id}`}
                    className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] p-1"
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
                {(isAdmin() || isCSM()) && (
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/invoices/${invoice._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "ALL"
              ? "Aucune facture trouvée avec ces critères"
              : "Aucune facture pour le moment"}
          </div>
          {!searchTerm && statusFilter === "ALL" && (isAdmin() || isCSM()) && (
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer votre première facture
            </Link>
          )}
        </div>
      )}

      {/* Floating Action Button - Admin and CSM only */}
      {(isAdmin() || isCSM()) && (
        <Link
          href="/dashboard/invoices/new"
          className="fixed bottom-6 right-6 bg-[hsl(25,100%,53%)] text-white p-4 rounded-full shadow-lg hover:bg-[hsl(25,90%,48%)] transition-colors z-10"
          title="Créer une facture"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </>
  );
}
