import { z } from "zod";
import {
  bookingSchema,
  loginSchema,
  paymentSchema,
  registerSchema,
} from "./validations";

// Fonction de sanitisation des données
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === "string") {
    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Supprimer les balises script complètes
      .replace(/<[^>]*>/g, "") // Supprimer toutes les autres balises HTML
      .replace(/javascript:/gi, "") // Supprimer les protocoles dangereux
      .replace(/on\w+\s*=/gi, ""); // Supprimer les événements inline
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// Fonction de validation avec sanitisation
export async function validateAndSanitize<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Promise<
  { success: true; data: z.infer<T> } | { success: false; errors: string[] }
> {
  try {
    // Sanitiser les données d'abord
    const sanitizedData = sanitizeInput(data);

    // Valider avec le schéma
    const validatedData = await schema.parseAsync(sanitizedData);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => err.message),
      };
    }

    return {
      success: false,
      errors: ["Erreur de validation inconnue"],
    };
  }
}

// Fonctions spécifiques pour chaque type de validation
export const validateLogin = (data: unknown) =>
  validateAndSanitize(loginSchema, data);
export const validateRegister = (data: unknown) =>
  validateAndSanitize(registerSchema, data);
export const validateAppointment = (data: unknown) =>
  validateAndSanitize(bookingSchema, data);
export const validatePayment = (data: unknown) =>
  validateAndSanitize(paymentSchema, data);

// Fonction de validation des tokens
export function validateToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;

  // Vérifier la longueur minimale
  if (token.length < 32) return false;

  // Vérifier le format (base64 ou hex)
  const validFormats = /^[A-Za-z0-9+/=]+$|^[A-Fa-f0-9]+$/;
  if (!validFormats.test(token)) return false;

  return true;
}

// Fonction de validation des emails
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Fonction de validation des numéros de téléphone
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return (
    (cleaned.startsWith("0") && cleaned.length === 10) ||
    (cleaned.startsWith("33") && cleaned.length === 11) ||
    (cleaned.startsWith("+33") && cleaned.length === 12)
  );
}

// Fonction de validation des mots de passe
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (password.length > 128) {
    errors.push("Le mot de passe est trop long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Fonction de validation des numéros de carte
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.length < 13 || cleaned.length > 19) return false;

  // Algorithme de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i] as string);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Fonction de validation des dates d'expiration
export function validateExpiryDate(expiryDate: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(expiryDate)) return false;

  const [, month, year] = expiryDate.match(regex) || [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (typeof year === "undefined" || typeof month === "undefined") return false;

  const expYear = parseInt(year, 10);
  const expMonth = parseInt(month, 10);

  if (isNaN(expYear) || isNaN(expMonth)) return false;

  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
}

// Fonction de validation des codes CVV
export function validateCVV(cvv: string): boolean {
  const cleaned = cvv.replace(/\D/g, "");
  return cleaned.length >= 3 && cleaned.length <= 4;
}
