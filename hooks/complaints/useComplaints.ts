'use client';

/**
 * Custom Hook pour récupérer les réclamations
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { Complaint } from '@/types/complaints';
import { UseComplaintsOptions, UseComplaintsReturn } from '@/types/hooks';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer la récupération des réclamations
 * Implémente le Custom Hooks Pattern
 */
export function useComplaints(): UseComplaintsReturn {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchComplaints = useCallback(
    async (options?: UseComplaintsOptions) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (options?.userId) params.append('userId', options.userId);
        if (options?.provider) params.append('provider', options.provider);
        if (options?.appointmentId)
          params.append('appointmentId', options.appointmentId);
        if (options?.type) params.append('type', options.type);
        if (options?.priority) params.append('priority', options.priority);
        if (options?.status) params.append('status', options.status);
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        const response = await fetch(`/api/complaints?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || 'Erreur lors de la récupération des réclamations'
          );
        }

        const data = await response.json();
        if (data.success && data.complaints) {
          // Convertir les dates string en Date objects
          const parsedComplaints: Complaint[] = data.complaints.map(
            (c: any) => ({
              ...c,
              createdAt:
                typeof c.createdAt === 'string'
                  ? c.createdAt
                  : new Date(c.createdAt).toISOString(),
              updatedAt:
                typeof c.updatedAt === 'string'
                  ? c.updatedAt
                  : new Date(c.updatedAt).toISOString(),
            })
          );
          setComplaints(parsedComplaints);
          setTotal(data.total || parsedComplaints.length);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via les services avec @Log decorator
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    complaints,
    loading,
    error,
    total,
    fetchComplaints,
  };
}
