"use client";

import { useAuth } from "@/hooks";
import { useQuoteFilters } from "@/hooks/quotes";
import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import QuotesFilters from "./QuotesFilters";
import QuotesHeader from "./QuotesHeader";
import QuotesTable from "./QuotesTable";

const QuotesPage = React.memo(function QuotesPage() {
  const { isCustomer: _isCustomer } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "ALL"
  >("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Mock data pour les devis
  const mockQuotes = [
    {
      id: "1",
      number: "DEV-2024-001",
      title: "Services de santé à domicile",
      provider: "Dr. Marie Dubois",
      amount: 450.0,
      status: "PENDING",
      createdAt: "2024-01-15",
      validUntil: "2024-02-15",
      services: [
        "Consultation médicale",
        "Soins à domicile",
        "Suivi post-opératoire",
      ],
    },
    {
      id: "2",
      number: "DEV-2024-002",
      title: "Services éducatifs",
      provider: "Institut Éducatif Plus",
      amount: 320.0,
      status: "APPROVED",
      createdAt: "2024-01-10",
      validUntil: "2024-02-10",
      services: [
        "Cours particuliers",
        "Soutien scolaire",
        "Préparation examens",
      ],
    },
    {
      id: "3",
      number: "DEV-2024-003",
      title: "Services de construction",
      provider: "BTP Excellence",
      amount: 1250.0,
      status: "REJECTED",
      createdAt: "2024-01-05",
      validUntil: "2024-02-05",
      services: ["Rénovation cuisine", "Installation électrique", "Plomberie"],
    },
  ];

  const { filteredQuotes, updateFilter, clearFilters, hasActiveFilters } =
    useQuoteFilters(mockQuotes);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/quotes/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/quotes/${id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      // Implémenter la suppression
      console.log("Supprimer le devis:", id);
    }
  }, []);

  const handleDownload = useCallback((id: string) => {
    // Implémenter le téléchargement du devis
    console.log("Télécharger le devis:", id);
  }, []);

  const handleApprove = useCallback((id: string) => {
    if (confirm("Êtes-vous sûr de vouloir approuver ce devis ?")) {
      // Implémenter l'approbation
      console.log("Approuver le devis:", id);
    }
  }, []);

  const handleReject = useCallback((id: string) => {
    if (confirm("Êtes-vous sûr de vouloir rejeter ce devis ?")) {
      // Implémenter le rejet
      console.log("Rejeter le devis:", id);
    }
  }, []);

  const handleAddQuote = useCallback(() => {
    router.push("/dashboard/quotes/new");
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter("searchTerm", value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "ALL") => {
      setStatusFilter(value);
      updateFilter("statusFilter", value);
    },
    [updateFilter]
  );

  const handleDateChange = useCallback(
    (value: string) => {
      setDateFilter(value);
      updateFilter("dateFilter", value);
    },
    [updateFilter]
  );

  // Correct type check for customer access
  if (!_isCustomer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Accès non autorisé
        </h1>
        <p className="text-gray-600">
          Seuls les clients peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuotesHeader
        totalQuotes={filteredQuotes.length}
        onAddQuote={handleAddQuote}
      />

      <QuotesFilters
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

      <QuotesTable
        quotes={filteredQuotes}
        loading={false}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
});

QuotesPage.displayName = "QuotesPage";

export default QuotesPage;
