"use client";

import { useAuth } from "@/hooks";
import { useInvoiceFilters } from "@/hooks/invoices";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import InvoicesFilters from "./InvoicesFilters";
import InvoicesHeader from "./InvoicesHeader";
import InvoicesTable from "./InvoicesTable";
import InvoicesTabs from "./InvoicesTabs";

const InvoicesPage = React.memo(function InvoicesPage() {
  const { user, isAdmin, isProvider, isCustomer } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "PAID" | "PENDING" | "OVERDUE" | "CANCELLED" | "ALL"
  >("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "as-provider" | "as-customer"
  >("all");

  // Simuler des données pour l'exemple
  useEffect(() => {
    if (user) {
      const mockInvoices = [
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
              description: "Consultation médicale",
              quantity: 1,
              unitPrice: 1500,
              total: 1500,
            },
          ],
        },
        {
          _id: "2",
          invoiceNumber: "FACT-2024-002",
          customerId: "customer-2",
          providerId: "provider-2",
          amount: 800,
          currency: "EUR",
          status: "PENDING",
          issueDate: new Date("2024-01-20"),
          dueDate: new Date("2024-02-20"),
          items: [
            {
              description: "Service de réparation",
              quantity: 2,
              unitPrice: 400,
              total: 800,
            },
          ],
        },
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    }
  }, [user]);

  const { filteredInvoices, updateFilter, clearFilters, hasActiveFilters } =
    useInvoiceFilters(invoices);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      setInvoices(prev => prev.filter(invoice => invoice._id !== id));
    }
  }, []);

  const handleDownload = useCallback((id: string) => {
    // Implémenter le téléchargement de la facture
    console.log("Télécharger la facture:", id);
  }, []);

  const handleAddInvoice = useCallback(() => {
    router.push("/dashboard/invoices/new");
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter("searchTerm", value);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED" | "ALL") => {
      setStatusFilter(value);
      updateFilter("statusFilter", value);
    },
    [updateFilter],
  );

  const handleDateChange = useCallback(
    (value: string) => {
      setDateFilter(value);
      updateFilter("dateFilter", value);
    },
    [updateFilter],
  );

  return (
    <div className="space-y-6">
      <InvoicesHeader
        totalInvoices={filteredInvoices.length}
        onAddInvoice={handleAddInvoice}
      />

      <InvoicesTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin()}
        isProvider={isProvider()}
        isCustomer={isCustomer()}
      />

      <InvoicesFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        dateFilter={dateFilter}
        setDateFilter={handleDateChange}
      />

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Effacer tous les filtres
          </button>
        </div>
      )}

      <InvoicesTable
        invoices={filteredInvoices}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
});

InvoicesPage.displayName = "InvoicesPage";

export default InvoicesPage;
