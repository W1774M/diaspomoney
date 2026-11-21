"use client";

import { MOCK_INVOICES } from "@/mocks";
import { useMemo } from "react";

interface UseInvoiceStatsProps {
  userId?: string;
  isAdmin?: boolean;
  isProvider?: boolean;
  isCustomer?: boolean;
}

interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  cancelledInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export function useInvoiceStats({
  userId,
  isAdmin = false,
  isProvider = false,
  isCustomer = false,
}: UseInvoiceStatsProps = {}): InvoiceStats {
  return useMemo(() => {
    let filteredInvoices = [...MOCK_INVOICES];

    // Filtrer selon le rôle de l'utilisateur
    if (!isAdmin) {
      if (isProvider) {
        // Les providers voient leurs factures (où ils sont le providerId)
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.providerId === userId,
        );
      } else if (isCustomer) {
        // Les customers voient leurs factures (où ils sont le customerId)
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.customerId === userId,
        );
      } else if (userId) {
        // Si un userId est spécifié mais pas de rôle, filtrer par customerId ou providerId
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.customerId === userId || invoice.providerId === userId,
        );
      }
    }

    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(
      invoice => invoice.status === "PAID",
    ).length;
    const pendingInvoices = filteredInvoices.filter(
      invoice => invoice.status === "SENT",
    ).length;
    const overdueInvoices = filteredInvoices.filter(
      invoice => invoice.status === "OVERDUE",
    ).length;
    const cancelledInvoices = filteredInvoices.filter(
      invoice => invoice.status === "CANCELLED",
    ).length;

    const totalAmount = filteredInvoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    );
    const paidAmount = filteredInvoices
      .filter(invoice => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingAmount = filteredInvoices
      .filter(invoice => invoice.status === "SENT")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const overdueAmount = filteredInvoices
      .filter(invoice => invoice.status === "OVERDUE")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      cancelledInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
    };
  }, [userId, isAdmin, isProvider, isCustomer]);
}
