"use client";

import { useCallback, useMemo } from "react";
import { childLogger } from "@/lib/logger";
import type {
  ServiceBookingState,
  ServiceType,
} from "@/lib/types/service-booking.types";

const logger = childLogger({ component: "useServiceBookingDraft" });
const STORAGE_KEY = "serviceBookingData";

type StoredServiceBookingState = ServiceBookingState & {
  draftBookingId?: string | null;
};

export function createEmptyServiceBookingState(
  serviceType: ServiceType | null,
): ServiceBookingState {
  return {
    currentStep: 1,
    serviceType,
    clientInfo: {},
    beneficiaryInfo: {},
    selectedClinic: null,
    selectedService: null,
    additionalOptions: [],
    paymentIntentId: null,
    paymentConfirmed: false,
    availability: {
      selectedDate: null,
      selectedTime: null,
    },
    totalAmount: 0,
  };
}

function normalizeDraft(
  parsed: StoredServiceBookingState,
  initialServiceType: ServiceType | null,
): StoredServiceBookingState | null {
  if (parsed.serviceType !== initialServiceType && initialServiceType) {
    return null;
  }

  return {
    ...parsed,
    serviceType: initialServiceType ?? parsed.serviceType,
    currentStep: parsed.currentStep || 1,
    selectedClinic: parsed.selectedClinic ?? null,
    additionalOptions: Array.isArray(parsed.additionalOptions)
      ? parsed.additionalOptions
      : [],
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function useServiceBookingDraft(initialServiceType: ServiceType | null) {
  const loadDraft = useCallback((): StoredServiceBookingState | null => {
    if (!canUseStorage()) return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved) as StoredServiceBookingState;
      const draft = normalizeDraft(parsed, initialServiceType);
      if (!draft) return null;

      logger.debug(
        {
          serviceType: draft.serviceType,
          additionalOptionsCount: draft.additionalOptions?.length || 0,
          additionalOptions:
            draft.additionalOptions?.map((opt) => ({
              id: opt.id,
              label: opt.label,
              price: opt.price,
            })) || [],
        },
        "Données restaurées depuis localStorage",
      );

      return draft;
    } catch (error) {
      logger.error({ error }, "Erreur lors de la lecture du cache");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, [initialServiceType]);

  const getInitialState = useCallback((): ServiceBookingState => {
    return loadDraft() ?? createEmptyServiceBookingState(initialServiceType);
  }, [initialServiceType, loadDraft]);

  const saveDraft = useCallback((state: StoredServiceBookingState) => {
    if (!canUseStorage()) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      logger.error({ error }, "Erreur lors de la sauvegarde du cache");
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (!canUseStorage()) return;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const readDraftBookingId = useCallback((): string | null => {
    return loadDraft()?.draftBookingId ?? null;
  }, [loadDraft]);

  return useMemo(
    () => ({
      clearDraft,
      getInitialState,
      loadDraft,
      readDraftBookingId,
      saveDraft,
    }),
    [clearDraft, getInitialState, loadDraft, readDraftBookingId, saveDraft],
  );
}
