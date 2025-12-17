"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useEffect, useState, useMemo } from "react";
import { logger } from "@/lib/logger";

// Dans Next.js, les variables d'environnement côté client doivent avoir le préfixe NEXT_PUBLIC_
// Nettoyer la clé pour enlever les guillemets et espaces
const rawKey = process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] as string | undefined;

// Fonction de nettoyage robuste pour enlever tous les guillemets
function cleanStripeKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  let cleaned = key.trim();
  
  // Enlever tous les guillemets doubles au début et à la fin (répétition possible)
  while (cleaned.startsWith('"') || cleaned.startsWith("'")) {
    cleaned = cleaned.substring(1);
  }
  while (cleaned.endsWith('"') || cleaned.endsWith("'")) {
    cleaned = cleaned.slice(0, -1);
  }
  
  // Nettoyage final avec regex pour les cas restants
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();
  
  return cleaned || undefined;
}

const publishableKey = cleanStripeKey(rawKey);

// Log pour déboguer (sans exposer la clé complète)
logger.info({ 
  hasStripeKey: !!publishableKey,
  keyLength: publishableKey?.length,
  keyPrefix: publishableKey?.substring(0, 7),
  rawKeyLength: rawKey?.length,
  rawKeyPrefix: rawKey?.substring(0, 10),
  hasQuotesInRaw: rawKey ? (rawKey.includes('"') || rawKey.includes("'")) : false,
}, "Stripe publishable key check");

// Vérifier que la clé est valide avant de l'utiliser
if (publishableKey && (publishableKey.includes('"') || publishableKey.includes("'"))) {
  logger.error({ 
    keyLength: publishableKey.length,
    keyPrefix: publishableKey.substring(0, 20),
  }, "ERROR: Stripe key still contains quotes after cleaning!");
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type StripeCheckoutProps = {
  amountInMinorUnit: number; // cents
  currency?: string; // default eur
  customerEmail?: string;
  metadata?: Record<string, string>;
  onSuccess: (_: string) => Promise<void> | void;
  onError?: (_msg: string) => void;
  renderActions?: (props: { amount: number; submitting: boolean }) => React.ReactNode;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ne pas recréer le PaymentIntent si on a déjà un clientSecret
    if (clientSecret) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    
    // Timeout de 30 secondes pour éviter que ça tourne indéfiniment
    const timeoutId = setTimeout(() => {
      if (!cancelled && !clientSecret && !error) {
        controller.abort();
        const timeoutError = "Le paiement prend trop de temps à s'initialiser. Veuillez réessayer.";
        logger.error({ timeout: true }, "Payment intent creation timeout");
        setError(timeoutError);
        onError?.(timeoutError);
        setIsLoading(false);
      }
    }, 30000);
    
    (async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        logger.info({ 
          amountInMinorUnit, 
          currency, 
          hasEmail: !!customerEmail,
          hasMetadata: !!metadata, 
        }, "Creating payment intent");
        
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountInMinorUnit,
            currency,
            email: customerEmail,
            metadata,
          }),
          signal: controller.signal,
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
          const errorMessage = errorData.error || errorData.message || `Erreur HTTP ${res.status}`;
          const errorDetails = errorData.details || errorData.code || '';
          logger.error({ 
            status: res.status, 
            statusText: res.statusText,
            error: errorData,
            errorDetails,
            fullError: JSON.stringify(errorData, null, 2),
          }, "Failed to create payment intent");
          throw new Error(
            errorDetails 
              ? `${errorMessage} (${errorDetails})` 
              : errorMessage,
          );
        }
        
        const data = await res.json();
        
        if (!data.clientSecret) {
          logger.error({ data }, "Payment intent created but no clientSecret in response");
          throw new Error("Le serveur n'a pas retourné de clientSecret");
        }
        
        logger.info({ 
          paymentIntentId: data.paymentIntentId,
          hasClientSecret: !!data.clientSecret, 
        }, "Payment intent created successfully");
        
        if (!cancelled && !clientSecret) {
          setClientSecret(data.clientSecret);
          setIsLoading(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          logger.info({}, "Payment intent creation cancelled");
          return;
        }
        
        const msg = error?.message || "Erreur lors de l'initialisation du paiement";
        logger.error({ error, message: msg }, "Error creating payment intent");
        if (!cancelled) {
          setError(msg);
          setIsLoading(false);
          onError?.(msg);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [amountInMinorUnit, currency, customerEmail, metadata, onError, clientSecret, error]);

  // Tous les hooks doivent être appelés avant les returns conditionnels
  // Utiliser useMemo pour éviter de recréer les options à chaque render
  const elementsOptions = useMemo(() => {
    if (!clientSecret) {
      return null;
    }
    return {
      clientSecret: clientSecret as string,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "hsl(23, 100%, 53%)",
          colorBackground: "#ffffff",
          colorText: "#1f2937",
          colorDanger: "#ef4444",
          fontFamily: "system-ui, sans-serif",
          spacingUnit: "4px",
          borderRadius: "8px",
        },
      },
      locale: "fr",
    } as StripeElementsOptions;
  }, [clientSecret]);

  // Maintenant on peut faire les returns conditionnels
  if (!stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Clé publique Stripe manquante</span>
        </div>
        <p className="text-sm text-red-500 mt-2">
          Veuillez configurer la clé publique Stripe dans les variables d&apos;environnement.
        </p>
      </div>
    );
  }

  if (!clientSecret && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(23,100%,53%)]"></div>
          <div>
            <p className="text-sm font-medium text-gray-700">Initialisation du paiement sécurisé…</p>
            <p className="text-xs text-gray-500 mt-1">Cela peut prendre quelques secondes</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret && error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">Impossible d'initialiser le paiement</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setClientSecret(null);
                // Forcer le re-render pour relancer le useEffect
                window.location.reload();
              }}
              className="text-sm text-red-600 hover:text-red-800 underline font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas rendre Elements si pas de clientSecret ou options
  if (!clientSecret || !elementsOptions) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={elementsOptions}
    >
      <InnerCheckout
        amountInMinorUnit={amountInMinorUnit}
        onSuccess={onSuccess}
        {...(props.renderActions ? { renderActions: props.renderActions } : {})}
        // Only pass onError if it's defined, to match the expected type
        {...(onError ? { onError } : {})}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Erreur de paiement</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </Elements>
  );
}

function InnerCheckout({
  amountInMinorUnit,
  onSuccess,
  onError,
  renderActions,
}: {
  amountInMinorUnit: number;
  onSuccess: (_: string) => Promise<void> | void;
  onError?: (_msg: string) => void;
  renderActions?: (props: { amount: number; submitting: boolean }) => React.ReactNode;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [elementError, setElementError] = useState<string | null>(null);

  // Réinitialiser elementReady quand les éléments changent
  useEffect(() => {
    if (!elements) {
      setElementReady(false);
      setElementError(null);
    }
  }, [elements]);

  // Timeout pour détecter si l'élément ne se charge pas
  useEffect(() => {
    if (!elements || elementReady || elementError) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!elementReady) {
        const errorMsg = "Le formulaire de paiement prend trop de temps à se charger. Veuillez vérifier votre connexion ou rafraîchir la page.";
        logger.error({}, "PaymentElement initialization timeout");
        setElementError(errorMsg);
        onError?.(errorMsg);
      }
    }, 10000); // 10 secondes

    return () => clearTimeout(timeout);
  }, [elements, elementReady, elementError, onError]);

  const handleSubmit = async () => {
    // Empêcher les doubles soumissions
    if (submitting || paymentConfirmed) {
      logger.warn({ 
        submitting,
        paymentConfirmed,
      }, "Payment already being processed or confirmed");
      return;
    }

    if (!stripe || !elements) {
      logger.warn({ 
        hasStripe: !!stripe,
        hasElements: !!elements,
      }, "Stripe or elements not ready");
      return;
    }

    // Vérifier que le PaymentElement est monté
    if (!elementReady) {
      logger.warn({ 
        elementReady,
      }, "PaymentElement not ready yet");
      onError?.("Le formulaire de paiement n'est pas encore prêt. Veuillez patienter quelques instants.");
      return;
    }

    // Vérifier explicitement que l'élément est disponible et monté
    let paymentElement;
    try {
      paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        logger.error({ 
          elementReady,
          hasElements: !!elements,
        }, "PaymentElement not found in elements");
        onError?.("Le formulaire de paiement n'est pas disponible. Veuillez rafraîchir la page.");
        return;
      }
      logger.info({ 
        hasPaymentElement: !!paymentElement,
      }, "PaymentElement found");
    } catch (error) {
      logger.error({ 
        error,
        elementReady,
      }, "Error checking PaymentElement");
      onError?.("Erreur lors de la vérification du formulaire de paiement.");
      return;
    }
    
    setSubmitting(true);
    try {
      logger.info({ 
        amount: amountInMinorUnit / 100,
        elementReady,
        hasPaymentElement: !!paymentElement,
      }, "Confirming payment...");
      
      // Vérifier une dernière fois que l'élément est toujours disponible
      // Avec un mécanisme de retry si l'élément n'est pas immédiatement disponible
      let currentElement = elements.getElement('payment');
      if (!currentElement) {
        // Attendre un peu et réessayer (peut-être que l'élément est en train de se monter)
        logger.warn({}, "PaymentElement not found, waiting and retrying...");
        await new Promise(resolve => setTimeout(resolve, 200));
        currentElement = elements.getElement('payment');
        
        if (!currentElement) {
          logger.error({}, "PaymentElement still not found after retry");
          onError?.("Le formulaire de paiement n'est plus disponible. Veuillez rafraîchir la page.");
          setSubmitting(false);
          return;
        }
        logger.info({}, "PaymentElement found after retry");
      }
      
      // Vérification finale avant l'appel
      logger.info({ 
        hasElement: !!currentElement,
        elementReady,
      }, "About to call confirmPayment");
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Ne pas spécifier de paramètres supplémentaires pour éviter les conflits
        },
        redirect: "if_required",
      });
      
      if (error) {
        const msg = error.message || "Le paiement a échoué";
        
        // Extraire toutes les propriétés de l'erreur Stripe de manière sécurisée
        const errorDetails: Record<string, any> = {
          message: error.message || 'Unknown error',
          type: error.type || 'unknown',
        };
        
        // Ajouter les propriétés optionnelles si elles existent
        if (error.code) errorDetails["code"] = error.code;
        if (error.decline_code) errorDetails["decline_code"] = error.decline_code;
        if (error.param) errorDetails["param"] = error.param;
        if (error.payment_intent) {
          errorDetails["paymentIntentId"] = typeof error.payment_intent === 'string' 
            ? error.payment_intent 
            : error.payment_intent.id;
        }
        if (error.payment_method) {
          errorDetails["paymentMethodId"] = typeof error.payment_method === 'string'
            ? error.payment_method
            : error.payment_method.id;
        }
        
        // Si l'erreur indique que le PaymentIntent est déjà confirmé, vérifier son état
        if (error.code === 'payment_intent_unexpected_state' && error.payment_intent) {
          const paymentIntentId = typeof error.payment_intent === 'string' 
            ? error.payment_intent 
            : error.payment_intent.id;
          
          try {
            // Récupérer l'état actuel du PaymentIntent
            const currentIntent = await stripe.retrievePaymentIntent(paymentIntentId);
            
            if (currentIntent.paymentIntent?.status === 'succeeded' || 
                currentIntent.paymentIntent?.status === 'processing') {
              // Le paiement est déjà confirmé, appeler onSuccess
              logger.info({ 
                paymentIntentId,
                status: currentIntent.paymentIntent.status,
              }, "Payment already confirmed, calling onSuccess");
              
              setPaymentConfirmed(true);
              await onSuccess(paymentIntentId);
              setSubmitting(false);
              return;
            }
          } catch (retrieveError) {
            logger.warn({ 
              error: retrieveError,
              paymentIntentId,
            }, "Failed to retrieve payment intent status");
          }
        }
        
        logger.error(errorDetails, "Payment confirmation error");
        onError?.(msg);
        setSubmitting(false);
        return;
      }
      
      if (!paymentIntent) {
        logger.error({ 
          hasError: false,
          hasPaymentIntent: false,
        }, "No paymentIntent returned from confirmPayment");
        onError?.("Aucune information de paiement retournée");
        setSubmitting(false);
        return;
      }
      
      logger.info({ 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status, 
      }, "Payment confirmed");
      
      // Marquer le paiement comme confirmé pour éviter les doubles soumissions
      setPaymentConfirmed(true);
      
      // Vérifier que le paiement est bien complété avant d'appeler onSuccess
      if (paymentIntent.status === "succeeded") {
        // Paiement réussi, appeler onSuccess
        await onSuccess(paymentIntent.id);
      } else if (paymentIntent.status === "requires_action") {
        // 3DS - l'action est gérée automatiquement par Stripe avec redirect: "if_required"
        // Attendre que le paiement soit complété après l'action
        // Note: Stripe gère automatiquement le redirect pour 3DS
        // On considère que c'est un succès car l'utilisateur a complété l'authentification
        await onSuccess(paymentIntent.id);
      } else if (paymentIntent.status === "processing") {
        // Paiement en cours de traitement (pour certaines méthodes comme les virements)
        // On considère que c'est un succès car le paiement est en cours
        await onSuccess(paymentIntent.id);
      } else {
        // Paiement non complété (requires_payment_method, canceled, etc.)
        logger.warn({ 
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id,
        }, "Payment not completed");
        onError?.(`Paiement non complété. Statut: ${paymentIntent.status}`);
        setPaymentConfirmed(false); // Réinitialiser si le paiement n'est pas complété
        setSubmitting(false);
        return;
      }
    } catch (error: any) {
      // Extraire les détails de l'erreur de manière sécurisée
      const errorDetails: Record<string, any> = {
        errorMessage: error?.message || 'Unknown error',
        errorName: error?.name || 'Error',
      };
      
      // Ajouter la stack trace si disponible
      if (error?.stack) {
        errorDetails["stack"] = error.stack;
      }
      
      // Si c'est une erreur Stripe, extraire les détails supplémentaires
      if (error?.type) {
        errorDetails["type"] = error.type;
      }
      if (error?.code) {
        errorDetails["code"] = error.code;
      }
      
      logger.error(errorDetails, "Unexpected error during payment");
      onError?.(error?.message || "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  };

  const amount = amountInMinorUnit / 100;

  return (
    <div className="space-y-6">
      {/* Message d'erreur d'initialisation */}
      {elementError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Erreur d'initialisation</p>
              <p className="text-sm text-red-700 mt-1">{elementError}</p>
              <p className="text-xs text-red-600 mt-2">
                Si le problème persiste, vérifiez que la clé publique Stripe est correctement configurée.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Formulaire Stripe */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <PaymentElement 
          options={{ 
            layout: "tabs",
            // Stripe affichera automatiquement les cartes enregistrées si un customer est associé au PaymentIntent
            // L'utilisateur peut sélectionner une carte existante ou en ajouter une nouvelle
          }} 
          onReady={() => {
            logger.info({}, "PaymentElement onReady callback fired");
            setElementError(null); // Réinitialiser l'erreur si l'élément se charge
            // Attendre un peu pour s'assurer que l'élément est complètement monté
            setTimeout(() => {
              // Vérifier que l'élément est vraiment disponible
              if (elements) {
                try {
                  const element = elements.getElement('payment');
                  if (element) {
                    logger.info({}, "PaymentElement is fully mounted and ready");
                    setElementReady(true);
                    setElementError(null);
                  } else {
                    logger.warn({}, "PaymentElement onReady fired but element not found");
                    const errorMsg = "Le formulaire de paiement n'a pas pu être initialisé correctement. Veuillez vérifier votre clé Stripe.";
                    setElementError(errorMsg);
                    onError?.(errorMsg);
                  }
                } catch (error) {
                  logger.error({ error }, "Error checking PaymentElement after onReady");
                  const errorMsg = "Erreur lors de l'initialisation du formulaire de paiement. Veuillez vérifier votre clé Stripe.";
                  setElementError(errorMsg);
                  onError?.(errorMsg);
                }
              }
            }, 100); // Petit délai pour s'assurer que tout est monté
          }}
        />
      </div>

      {/* Actions personnalisées ou bouton de paiement par défaut */}
      {renderActions ? (
        <div className="flex items-center gap-4">
          {renderActions({ amount, submitting })}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!stripe || !elementReady || submitting || paymentConfirmed}
            className="flex-1 bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            {submitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Traitement du paiement…</span>
              </>
            ) : paymentConfirmed ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Paiement confirmé</span>
              </>
            ) : !elementReady ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Chargement du formulaire…</span>
              </>
            ) : (
              <>
                <span>Payer {amount}€</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!stripe || !elementReady || submitting || paymentConfirmed}
          className="w-full bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
        >
          {submitting ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Traitement du paiement…</span>
            </>
          ) : paymentConfirmed ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Paiement confirmé</span>
            </>
          ) : !elementReady ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Chargement du formulaire…</span>
            </>
          ) : (
            <>
              <span>Payer {amount}€</span>
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
