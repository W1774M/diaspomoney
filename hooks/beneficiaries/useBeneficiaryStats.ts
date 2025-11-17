"use client";

import { Beneficiary, BeneficiaryStats } from "@/types/beneficiaries";
import { useMemo } from "react";

export function useBeneficiaryStats(
  beneficiaries: Beneficiary[],
): BeneficiaryStats {
  return useMemo(() => {
    // Sécurité : s'assurer que beneficiaries est un tableau
    const safeBeneficiaries = beneficiaries || [];
    const withAccount = safeBeneficiaries.filter(b => b.hasAccount).length;
    const withoutAccount = safeBeneficiaries.length - withAccount;

    const relationships = [
      ...new Set(safeBeneficiaries.map(b => b.relationship).filter(Boolean)),
    ].sort();

    return {
      totalBeneficiaries: safeBeneficiaries.length,
      withAccount,
      withoutAccount,
      relationships,
    };
  }, [beneficiaries]);
}
