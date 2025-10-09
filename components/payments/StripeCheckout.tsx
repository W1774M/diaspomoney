"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const publishableKey = process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] as
  | string
  | undefined;

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type StripeCheckoutProps = {
  amountInMinorUnit: number; // cents
  currency?: string; // default eur
  customerEmail?: string;
  metadata?: Record<string, string>;
  onSuccess: (_: string) => Promise<void> | void;
  onError?: (_msg: string) => void;
};

export function StripeCheckout(props: StripeCheckoutProps) {
  const {
    amountInMinorUnit,
    currency = "eur",
    customerEmail,
    metadata,
    onSuccess,
    onError,
  } = props;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // options are passed inline to Elements once clientSecret is available

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountInMinorUnit,
            currency,
            email: customerEmail,
            metadata,
          }),
        });
        if (!res.ok) throw new Error("Impossible de créer le paiement");
        const data = await res.json();
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (e: any) {
        const msg = e?.message || "Erreur lors de l'initialisation du paiement";
        setError(msg);
        onError?.(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountInMinorUnit, currency, customerEmail, metadata, onError]);

  if (!stripePromise) {
    return (
      <div className="text-red-600 text-sm">Clé publique Stripe manquante</div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-sm text-gray-600">Initialisation du paiement…</div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={
        {
          clientSecret: clientSecret as string,
          appearance: { theme: "stripe" },
          locale: "fr",
        } as StripeElementsOptions
      }
    >
      <InnerCheckout
        onSuccess={onSuccess}
        // Only pass onError if it's defined, to match the expected type
        {...(onError ? { onError } : {})}
      />
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </Elements>
  );
}

function InnerCheckout({
  onSuccess,
  onError,
}: {
  onSuccess: (_: string) => Promise<void> | void;
  onError?: (_msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });
      if (error) {
        const msg = error.message || "Le paiement a échoué";
        onError?.(msg);
        setSubmitting(false);
        return;
      }
      if (paymentIntent && paymentIntent.status === "succeeded") {
        await onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // 3DS done in confirmPayment with redirect: if_required; fallthrough
        await onSuccess(paymentIntent.id);
      } else {
        onError?.("Paiement non complété");
      }
    } catch (e: any) {
      onError?.(e?.message || "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || submitting}
        className="w-full bg-[hsl(25,100%,53%)] text-white py-3 px-4 rounded-md font-medium hover:bg-[hsl(25,100%,45%)] transition-colors disabled:opacity-50"
      >
        {submitting ? "Traitement du paiement…" : "Payer"}
      </button>
    </div>
  );
}
