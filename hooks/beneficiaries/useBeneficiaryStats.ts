"use client";

import { Beneficiary, BeneficiaryStats } from "@/types/beneficiaries";
import { useMemo } from "react";

export function useBeneficiaryStats(
  beneficiaries: Beneficiary[]
): BeneficiaryStats {
  return useMemo(() => {
    const withAccount = beneficiaries.filter(b => b.hasAccount).length;
    const withoutAccount = beneficiaries.length - withAccount;

    const relationships = [
      ...new Set(beneficiaries.map(b => b.relationship).filter(Boolean)),
    ].sort();

    return {
      totalBeneficiaries: beneficiaries.length,
      withAccount,
      withoutAccount,
      relationships,
    };
  }, [beneficiaries]);
}
