// Service Stripe pour la validation et le traitement des paiements
export interface StripeCardData {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  name: string;
}

export interface StripeValidationResult {
  valid: boolean;
  error?: string;
  token?: string;
}

/**
 * Valide les données de carte avec l'API Stripe
 */
export async function validateCardWithStripe(
  cardData: StripeCardData
): Promise<StripeValidationResult> {
  try {
    // Simulation de l'appel à l'API Stripe
    // En production, vous utiliseriez le SDK Stripe côté serveur

    // Validation basique des données
    if (!cardData.number || cardData.number.length < 13) {
      return { valid: false, error: "Numéro de carte invalide" };
    }

    if (!cardData.cvc || cardData.cvc.length < 3) {
      return { valid: false, error: "CVV invalide" };
    }

    if (!cardData.name || cardData.name.length < 2) {
      return { valid: false, error: "Nom du titulaire invalide" };
    }

    // Vérification de la date d'expiration
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      cardData.exp_year < currentYear ||
      (cardData.exp_year === currentYear && cardData.exp_month < currentMonth)
    ) {
      return { valid: false, error: "La carte a expiré" };
    }

    // Simulation d'un token Stripe
    const mockToken = `tok_${Math.random().toString(36).substr(2, 9)}`;

    return { valid: true, token: mockToken };
  } catch (error) {
    console.error("Erreur lors de la validation Stripe:", error);
    return {
      valid: false,
      error: "Erreur lors de la validation de la carte. Veuillez réessayer.",
    };
  }
}

/**
 * Traite le paiement avec Stripe
 */
export async function processPaymentWithStripe(
  token: string,
  amount: number,
  currency: string = "EUR"
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  try {
    // Simulation du traitement de paiement
    // En production, vous feriez un appel à votre API backend qui utilise Stripe

    console.log(
      `Traitement du paiement: ${amount}${currency} avec le token ${token}`
    );

    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation d'un succès (90% de chance)
    const success = Math.random() > 0.1;

    if (success) {
      const paymentId = `pi_${Math.random().toString(36).substr(2, 14)}`;
      return { success: true, paymentId };
    } else {
      return {
        success: false,
        error: "Le paiement a été refusé par votre banque",
      };
    }
  } catch (error) {
    console.error("Erreur lors du traitement du paiement:", error);
    return { success: false, error: "Erreur lors du traitement du paiement" };
  }
}

/**
 * Formate le numéro de carte pour l'affichage
 */
export function formatCardNumber(number: string): string {
  const cleaned = number.replace(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(" ").substring(0, 19);
}

/**
 * Formate la date d'expiration
 */
export function formatExpiryDate(date: string): string {
  const cleaned = date.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  }
  return cleaned;
}
