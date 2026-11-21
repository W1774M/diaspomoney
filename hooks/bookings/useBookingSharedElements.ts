'use client';

import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { useMemo } from 'react';

interface SharedElements {
  clientInfo?: boolean;
  beneficiaryInfo?: boolean;
  serviceDetails?: boolean;
  paymentInfo?: boolean;
  appointmentInfo?: boolean;
  additionalOptions?: boolean;
}

/**
 * Hook pour vérifier si un élément est autorisé à être affiché pour le prestataire
 */
export function useBookingSharedElements(booking: BookingResponse | null | undefined) {
  const { user } = useAuth();
  
  const sharedElements = useMemo<SharedElements | null>(() => {
    if (!booking || !user) return null;
    
    const userRoles = user.roles || [];
    const isProvider = userRoles.includes(ROLES.PROVIDER);
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    
    // Les admins voient tout
    if (isAdmin) {
      return {
        clientInfo: true,
        beneficiaryInfo: true,
        serviceDetails: true,
        paymentInfo: true,
        appointmentInfo: true,
        additionalOptions: true,
      };
    }
    
    // Si l'utilisateur n'est pas un prestataire ou n'est pas le prestataire assigné, voir tout
    if (!isProvider || booking.providerId !== user.id) {
      return {
        clientInfo: true,
        beneficiaryInfo: true,
        serviceDetails: true,
        paymentInfo: true,
        appointmentInfo: true,
        additionalOptions: true,
      };
    }
    
    // Pour les prestataires, vérifier les sharedElements dans les métadonnées
    // On vérifie d'abord sharedElementsWithProvider (nouveau format), puis sharedElements (ancien format)
    const metadataSharedElements = (booking.metadata?.['sharedElementsWithProvider'] || booking.metadata?.['sharedElements']) as SharedElements | undefined;
    
    // Par défaut, si pas de sharedElements défini, tout est visible (rétrocompatibilité)
    return metadataSharedElements || {
      clientInfo: true,
      beneficiaryInfo: true,
      serviceDetails: true,
      paymentInfo: false,
      appointmentInfo: true,
      additionalOptions: true,
    };
  }, [booking, user]);
  
  const isElementAllowed = useMemo(() => {
    return (element: keyof SharedElements): boolean => {
      if (!sharedElements) return true; // Par défaut, autoriser si pas de sharedElements
      return sharedElements[element] !== false; // Autoriser si non explicitement désactivé
    };
  }, [sharedElements]);
  
  return {
    sharedElements,
    isElementAllowed,
  };
}
