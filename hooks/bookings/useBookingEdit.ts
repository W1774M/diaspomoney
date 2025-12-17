/**
 * Hook personnalisé pour gérer l'édition d'une réservation
 */

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNotificationManager } from '@/components/ui/Notification';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface UseBookingEditProps {
  booking: BookingResponse | null | undefined;
  bookingId: string;
  refetch: () => Promise<void>;
}

export interface BookingEditData {
  // Informations client
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;
  // Informations bénéficiaire
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  // Service
  serviceLabel?: string;
  servicePrice?: number;
  serviceDescription?: string;
  // Rendez-vous
  appointmentDate?: Date | string | null;
  timeslot?: string;
  // Options supplémentaires
  additionalOptions?: any[];
  // Code promotionnel
  promotionCode?: string;
}

export function useBookingEdit({ booking, bookingId, refetch }: UseBookingEditProps) {
  const notificationManager = useNotificationManager();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingPromoCode, setIsValidatingPromoCode] = useState(false);
  const [promoCodeData, setPromoCodeData] = useState<any>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);

  // Initialiser les données d'édition depuis le booking
  const getInitialEditData = (): BookingEditData => {
    if (!booking) return {};
    
    const metadata = booking.metadata || {};
    const data: BookingEditData = {};
    
    if (metadata['clientFirstName']) data.clientFirstName = metadata['clientFirstName'] as string;
    if (metadata['clientLastName']) data.clientLastName = metadata['clientLastName'] as string;
    if (metadata['clientEmail']) data.clientEmail = metadata['clientEmail'] as string;
    if (metadata['clientPhone']) data.clientPhone = metadata['clientPhone'] as string;
    if (booking.recipient?.firstName) data.beneficiaryFirstName = booking.recipient.firstName;
    if (booking.recipient?.lastName) data.beneficiaryLastName = booking.recipient.lastName;
    if (booking.recipient?.phone) data.beneficiaryPhone = booking.recipient.phone;
    if (booking.recipient?.email) data.beneficiaryEmail = booking.recipient.email;
    if (metadata['serviceLabel']) data.serviceLabel = metadata['serviceLabel'] as string;
    if (metadata['servicePrice'] !== undefined && metadata['servicePrice'] !== null) {
      const price = typeof metadata['servicePrice'] === 'number' 
        ? metadata['servicePrice'] 
        : typeof metadata['servicePrice'] === 'string'
        ? parseFloat(metadata['servicePrice'])
        : null;
      if (price !== null && !isNaN(price)) {
        data.servicePrice = price;
      }
    }
    if (metadata['serviceDescription']) data.serviceDescription = metadata['serviceDescription'] as string;
    if (booking.appointmentDate) data.appointmentDate = new Date(booking.appointmentDate);
    if (booking.timeslot) data.timeslot = booking.timeslot;
    if (metadata['additionalOptions']) {
      data.additionalOptions = typeof metadata['additionalOptions'] === 'string' 
        ? JSON.parse(metadata['additionalOptions']) 
        : metadata['additionalOptions'];
    }
    if (metadata['promotionCode']) data.promotionCode = metadata['promotionCode'] as string;
    
    return data;
  };

  const [editData, setEditData] = useState<BookingEditData>(getInitialEditData());

  // Valider un code promotionnel
  const validatePromotionCode = async (code: string) => {
    if (!code || code.trim() === '') {
      setPromoCodeData(null);
      setPromoCodeError(null);
      return;
    }

    if (!booking) return;

    setIsValidatingPromoCode(true);
    setPromoCodeError(null);

    try {
      // Calculer le montant total actuel
      const basePrice = editData.servicePrice !== undefined
        ? editData.servicePrice
        : (typeof booking.metadata?.['basePrice'] === 'number' 
          ? booking.metadata['basePrice'] 
          : typeof booking.metadata?.['basePrice'] === 'string'
          ? parseFloat(booking.metadata['basePrice'])
          : 0);
      
      const optionsPrice = editData.additionalOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
      const totalAmount = basePrice + optionsPrice;

      const response = await fetch('/api/promotion-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: code.toUpperCase().trim(),
          amount: totalAmount,
        }),
      });

      const data = await response.json();
      if (data.success && data.valid) {
        // Stocker à la fois le code et le discount pour faciliter les calculs
        setPromoCodeData({
          ...data.code,
          discount: data.discount,
        });
        setPromoCodeError(null);
        notificationManager.addSuccess(`Code promotionnel valide : ${data.discount.percentage}% de réduction`);
      } else {
        setPromoCodeData(null);
        setPromoCodeError(data.error || 'Code promotionnel invalide');
        notificationManager.addError(data.error || 'Code promotionnel invalide');
      }
    } catch (error) {
      logger.error({ error }, 'Error validating promotion code');
      setPromoCodeData(null);
      setPromoCodeError('Erreur lors de la validation du code');
      notificationManager.addError('Erreur lors de la validation du code');
    } finally {
      setIsValidatingPromoCode(false);
    }
  };

  // Vérifier si le paiement a été effectué
  const isPaymentCompleted = () => {
    if (!booking) return false;
    const metadata = booking.metadata || {};
    const paymentStatus = metadata['paymentStatus'] as string | undefined;
    return paymentStatus === 'confirmed';
  };

  // Ouvrir le modal d'édition
  const openEditModal = () => {
    if (!booking) return;
    setEditData(getInitialEditData());
    setPromoCodeData(null);
    setPromoCodeError(null);
    setIsEditing(true);
  };

  // Fermer le modal d'édition
  const closeEditModal = () => {
    setIsEditing(false);
    setEditData(getInitialEditData());
    setPromoCodeData(null);
    setPromoCodeError(null);
  };

  // Sauvegarder les modifications
  const saveBooking = async () => {
    if (!booking) return;

    logger.info({ bookingId }, 'Admin editing booking');

    setIsSaving(true);
    try {
      const metadata = booking.metadata || {};
      
      // Construire les nouvelles métadonnées
      const updatedMetadata: Record<string, any> = {
        ...metadata,
        clientFirstName: editData.clientFirstName || metadata['clientFirstName'],
        clientLastName: editData.clientLastName || metadata['clientLastName'],
        clientEmail: editData.clientEmail || metadata['clientEmail'],
        clientPhone: editData.clientPhone || metadata['clientPhone'],
        serviceLabel: editData.serviceLabel || metadata['serviceLabel'],
        serviceDescription: editData.serviceDescription || metadata['serviceDescription'],
        additionalOptions: editData.additionalOptions && editData.additionalOptions.length > 0
          ? JSON.stringify(editData.additionalOptions.filter((opt: any) => opt.label || opt.id))
          : (editData.additionalOptions && editData.additionalOptions.length === 0 ? JSON.stringify([]) : metadata['additionalOptions']),
      };

      // Mettre à jour le prix si nécessaire
      if (editData.servicePrice !== undefined) {
        updatedMetadata['basePrice'] = editData.servicePrice;
        updatedMetadata['servicePrice'] = editData.servicePrice;
      }

      // Calculer les nouveaux montants si un code promotionnel est appliqué
      if (promoCodeData && !isPaymentCompleted()) {
        const basePrice = editData.servicePrice !== undefined
          ? editData.servicePrice
          : (typeof metadata['basePrice'] === 'number' 
            ? metadata['basePrice'] 
            : typeof metadata['basePrice'] === 'string'
            ? parseFloat(metadata['basePrice'])
            : 0);
        
        const optionsPrice = editData.additionalOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
        const subtotal = basePrice + optionsPrice;
        
        // Utiliser le montant de réduction calculé par l'API ou le calculer
        const discountAmount = promoCodeData.discount?.amount 
          ? promoCodeData.discount.amount
          : (promoCodeData.percentage 
            ? (subtotal * promoCodeData.percentage) / 100
            : 0);
        const totalAmount = subtotal - discountAmount;

        updatedMetadata['promotionCode'] = promoCodeData.label;
        updatedMetadata['promotionCodeId'] = promoCodeData._id || promoCodeData.id;
        updatedMetadata['discountPercentage'] = promoCodeData.percentage || promoCodeData.discount?.percentage;
        updatedMetadata['discountAmount'] = discountAmount;
        updatedMetadata['totalAmount'] = totalAmount;
        updatedMetadata['basePrice'] = basePrice;
        updatedMetadata['optionsPrice'] = optionsPrice;
      } else if (!promoCodeData && !isPaymentCompleted()) {
        // Retirer le code promotionnel si aucun n'est appliqué
        delete updatedMetadata['promotionCode'];
        delete updatedMetadata['promotionCodeId'];
        delete updatedMetadata['discountPercentage'];
        delete updatedMetadata['discountAmount'];
        
        // Recalculer le total sans réduction
        const basePrice = editData.servicePrice !== undefined
          ? editData.servicePrice
          : (typeof metadata['basePrice'] === 'number' 
            ? metadata['basePrice'] 
            : typeof metadata['basePrice'] === 'string'
            ? parseFloat(metadata['basePrice'])
            : 0);
        
        const optionsPrice = editData.additionalOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
        updatedMetadata['totalAmount'] = basePrice + optionsPrice;
        updatedMetadata['basePrice'] = basePrice;
        updatedMetadata['optionsPrice'] = optionsPrice;
      }

      // Préparer les données de mise à jour
      const updatePayload: any = {
        metadata: updatedMetadata,
      };

      // Mettre à jour le rendez-vous si modifié
      if (editData.appointmentDate !== undefined) {
        updatePayload.appointmentDate = editData.appointmentDate 
          ? (editData.appointmentDate instanceof Date 
            ? editData.appointmentDate.toISOString() 
            : editData.appointmentDate)
          : null;
      }

      if (editData.timeslot !== undefined) {
        updatePayload.timeslot = editData.timeslot;
      }

      // Mettre à jour le bénéficiaire si modifié (nécessite une route séparée ou mise à jour via metadata)
      // Pour l'instant, on stocke dans metadata
      if (editData.beneficiaryFirstName || editData.beneficiaryLastName || editData.beneficiaryPhone) {
        updatedMetadata['beneficiaryFirstName'] = editData.beneficiaryFirstName;
        updatedMetadata['beneficiaryLastName'] = editData.beneficiaryLastName;
        updatedMetadata['beneficiaryPhone'] = editData.beneficiaryPhone;
        updatedMetadata['beneficiaryEmail'] = editData.beneficiaryEmail;
      }

      // Appeler l'API de mise à jour
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la réservation');
      }

      const result = await response.json();
      if (result.success) {
        logger.info({ bookingId }, 'Booking updated successfully');
        notificationManager.addSuccess('Réservation mise à jour avec succès');
        await refetch();
        closeEditModal();
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error({ error, bookingId }, 'Error updating booking');
      notificationManager.addError(`Erreur lors de la mise à jour : ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    isSaving,
    isValidatingPromoCode,
    promoCodeData,
    promoCodeError,
    editData,
    setEditData,
    isPaymentCompleted: isPaymentCompleted(),
    openEditModal,
    closeEditModal,
    saveBooking,
    validatePromotionCode,
  };
}

