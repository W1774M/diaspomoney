"use client";

import { Complaint, ComplaintStats } from "@/types/complaints";
import { useMemo } from "react";

export function useComplaintStats(complaints: Complaint[]): ComplaintStats {
  return useMemo(() => {
    const openComplaints = complaints.filter(c => c.status === "OPEN").length;
    const inProgressComplaints = complaints.filter(
      c => c.status === "IN_PROGRESS"
    ).length;
    const resolvedComplaints = complaints.filter(
      c => c.status === "RESOLVED"
    ).length;
    const closedComplaints = complaints.filter(
      c => c.status === "CLOSED"
    ).length;

    return {
      totalComplaints: complaints.length,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
    };
  }, [complaints]);
}
