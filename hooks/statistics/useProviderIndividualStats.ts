'use client';

import { useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

export interface ProviderIndividualStats {
  activeOrders: number;
  completedOrders: number;
  revenueThisMonth: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  acceptanceRate: number;
}

// Fonction helper pour extraire le montant total d'une réservation
function getBookingAmount(b: BookingResponse): number {
  const anyB = b as any;
  const metadata = anyB?.metadata || {};
  
  // Essayer d'abord les champs directs
  const candidates = [
    anyB?.totalAmount,
    anyB?.price,
    anyB?.amount,
    metadata?.totalAmount,
    metadata?.price,
    metadata?.amount,
  ];
  const directValue = candidates.find((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
  if (directValue) return directValue;
  
  // Si pas de valeur directe, calculer à partir de basePrice + optionsPrice - discountAmount
  const basePrice = 
    (typeof metadata?.basePrice === 'number' ? metadata.basePrice : 0) ||
    (typeof metadata?.servicePrice === 'number' ? metadata.servicePrice : 0);
  
  const optionsPrice = (() => {
    if (metadata?.additionalOptions) {
      try {
        const options = typeof metadata.additionalOptions === 'string' 
          ? JSON.parse(metadata.additionalOptions) 
          : metadata.additionalOptions;
        if (Array.isArray(options)) {
          return options.reduce((sum: number, opt: any) => {
            const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
            return sum + optPrice;
          }, 0);
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
    return typeof metadata?.optionsPrice === 'number' ? metadata.optionsPrice : 0;
  })();
  
  const discountAmount = typeof metadata?.discountAmount === 'number' ? metadata.discountAmount : 0;
  
  const calculatedAmount = basePrice + optionsPrice - discountAmount;
  return calculatedAmount > 0 ? calculatedAmount : 0;
}

interface UseProviderIndividualStatsParams {
  userId?: string;
  enabled: boolean;
  providerInfo?: {
    type?: string;
    rating?: number;
    reviewCount?: number;
  };
}

export function useProviderIndividualStats({
  userId,
  enabled,
  providerInfo,
}: UseProviderIndividualStatsParams) {
  const { bookings = [] } = useBookings({
    providerId: enabled ? userId : undefined,
    limit: 100,
  });

  const stats = useMemo<ProviderIndividualStats | null>(() => {
    // Si providerInfo.type est défini et n'est pas INDIVIDUAL, ne pas afficher
    if (!enabled || !userId) return null;
    if (providerInfo?.type && providerInfo.type !== 'INDIVIDUAL') return null;

    // Filtrer uniquement les bookings attribués à ce prestataire
    // Les bookings sont déjà filtrés par providerId dans useBookings, mais on vérifie quand même
    const assignedBookings = bookings.filter(
      (b: BookingResponse) => b.providerId === userId || (b.metadata as any)?.['assignedProviderType'] === 'EXTERNAL'
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);

    // Commandes en cours : toutes les commandes attribuées qui ne sont pas FINISHED
    const activeOrders = assignedBookings.filter(
      (b: BookingResponse) => b.status !== BOOKING_STATUSES.FINISHED && b.status !== BOOKING_STATUSES.CANCELLED,
    );

    // Commandes terminées : toutes les commandes attribuées avec statut FINISHED
    const completedOrders = assignedBookings.filter(
      (b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED,
    );

    // Commandes terminées ce mois
    const completedThisMonth = completedOrders.filter((b: BookingResponse) => {
      const bookingDate = new Date(
        (b as any).date || b.appointmentDate || b.createdAt || b.updatedAt,
      );
      return bookingDate >= monthStart;
    });

    // Montant perçu ce mois (revenus des commandes terminées du mois)
    const revenueThisMonth = completedThisMonth.reduce(
      (sum: number, b: BookingResponse) => sum + getBookingAmount(b),
      0,
    );

    // Montant total perçu (revenus de toutes les commandes terminées)
    const totalRevenue = completedOrders.reduce(
      (sum: number, b: BookingResponse) => sum + getBookingAmount(b),
      0,
    );

    // Note moyenne et avis
    const averageRating = providerInfo?.rating || 0;
    const reviewCount = providerInfo?.reviewCount || 0;

    // Taux d'acceptation
    const totalRequests = assignedBookings.length;
    const acceptedRequests = assignedBookings.filter(
      (b: BookingResponse) => b.status !== BOOKING_STATUSES.CANCELLED,
    ).length;
    const acceptanceRate =
      totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    return {
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      revenueThisMonth,
      totalRevenue,
      averageRating,
      reviewCount,
      acceptanceRate,
    };
  }, [bookings, userId, enabled, providerInfo]);

  return stats;
}

