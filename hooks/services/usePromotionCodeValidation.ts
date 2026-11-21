"use client";

import { useCallback, useState } from "react";
import { useNotificationManager } from "@/components/ui/Notification";
import { childLogger } from "@/lib/logger";

const logger = childLogger({ component: "usePromotionCodeValidation" });

interface PromotionCodeData {
  _id?: string;
  id?: string;
  label: string;
  percentage: number;
}

interface ValidatePromotionCodeOptions {
  amount: number;
}

export function usePromotionCodeValidation() {
  const notificationManager = useNotificationManager();
  const [promotionCodeData, setPromotionCodeData] = useState<PromotionCodeData | null>(null);
  const [promotionCodeError, setPromotionCodeError] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const resetPromotionCode = useCallback(() => {
    setPromotionCodeData(null);
    setDiscountAmount(0);
    setPromotionCodeError(null);
  }, []);

  const validatePromotionCode = useCallback(
    async (code: string, { amount }: ValidatePromotionCodeOptions) => {
      if (!code || code.trim() === "") {
        resetPromotionCode();
        return;
      }

      setValidatingCode(true);
      setPromotionCodeError(null);

      try {
        const response = await fetch("/api/promotion-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: code.toUpperCase().trim(),
            amount,
          }),
        });

        const data = await response.json();
        if (data.success && data.valid) {
          setPromotionCodeData(data.code);
          setDiscountAmount(data.discount.amount);
          setPromotionCodeError(null);
          notificationManager.addSuccess(
            `Code promotionnel appliqué : ${data.discount.percentage}% de réduction`,
          );
        } else {
          setPromotionCodeData(null);
          setDiscountAmount(0);
          setPromotionCodeError(data.error || "Code promotionnel invalide");
          notificationManager.addError(data.error || "Code promotionnel invalide");
        }
      } catch (error) {
        logger.error({ error }, "Error validating promotion code");
        setPromotionCodeData(null);
        setDiscountAmount(0);
        setPromotionCodeError("Erreur lors de la validation du code");
        notificationManager.addError("Erreur lors de la validation du code");
      } finally {
        setValidatingCode(false);
      }
    },
    [notificationManager, resetPromotionCode],
  );

  return {
    discountAmount,
    promotionCodeData,
    promotionCodeError,
    resetPromotionCode,
    validatePromotionCode,
    validatingCode,
  };
}
