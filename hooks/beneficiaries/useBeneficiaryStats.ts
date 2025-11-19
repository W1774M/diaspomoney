"use client";

import type { Beneficiary, BeneficiaryStats } from "@/lib/types";
import { useMemo } from "react";

export function useBeneficiaryStats(
  beneficiaries: Beneficiary[],
): BeneficiaryStats {
  return useMemo(() => {
    // Sécurité : s'assurer que beneficiaries est un tableau
    const safeBeneficiaries = beneficiaries || [];
    const withAccount = safeBeneficiaries.filter(b => b.hasAccount).length;
    const withoutAccount = safeBeneficiaries.length - withAccount;

    const byRelationship: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    
    safeBeneficiaries.forEach(b => {
      if (b.relationship) {
        byRelationship[b.relationship] = (byRelationship[b.relationship] || 0) + 1;
      }
      if (b.country) {
        byCountry[b.country] = (byCountry[b.country] || 0) + 1;
      }
    });

    return {
      total: safeBeneficiaries.length,
      active: safeBeneficiaries.filter(b => b.isActive).length,
      inactive: safeBeneficiaries.filter(b => !b.isActive).length,
      withAccount,
      withoutAccount,
      byRelationship,
      byCountry,
    };
  }, [beneficiaries]);
}
