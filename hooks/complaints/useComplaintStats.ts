"use client";

import { Complaint, ComplaintStats } from "@/types/complaints";
import { useMemo } from "react";

export function useComplaintStats(complaints: Complaint[]): ComplaintStats {
  return useMemo(() => {
    // Sécurité : s'assurer que complaints est un tableau
    const safeComplaints = complaints || [];
    const openComplaints = safeComplaints.filter(c => c.status === "OPEN").length;
    const inProgressComplaints = safeComplaints.filter(
      c => c.status === "IN_PROGRESS"
    ).length;
    const resolvedComplaints = safeComplaints.filter(
      c => c.status === "RESOLVED"
    ).length;
    const closedComplaints = safeComplaints.filter(
      c => c.status === "CLOSED"
    ).length;

    return {
      totalComplaints: safeComplaints.length,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
    };
  }, [complaints]);
}
