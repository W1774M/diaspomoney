import { z } from "zod";

// Fonctions utilitaires pour la validation
const sanitizeString = (value: string) =>
  value
    .trim()
    .replace(/[<>]/g, "")
    .replace(/script/gi, "");
const validatePasswordStrength = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  return (
    hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
  );
};

// Schémas de validation sécurisés
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .transform(sanitizeString)
    .refine(email => email.length <= 254, "Email trop long"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe est trop long"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Le prénom est requis")
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Prénom invalide"),
    lastName: z
      .string()
      .min(1, "Le nom est requis")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Nom invalide"),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide")
      .transform(sanitizeString)
      .refine(email => email.length <= 254, "Email trop long"),
    phone: z
      .string()
      .min(1, "Le téléphone est requis")
      .transform(phone => phone.replace(/\D/g, ""))
      .refine(phone => {
        const cleaned = phone.replace(/\D/g, "");
        return (
          (cleaned.startsWith("0") && cleaned.length === 10) ||
          (cleaned.startsWith("33") && cleaned.length === 11) ||
          (cleaned.startsWith("+33") && cleaned.length === 12)
        );
      }, "Numéro de téléphone invalide"),
    dateOfBirth: z
      .string()
      .min(1, "La date de naissance est requise")
      .refine(date => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18 && age <= 120;
      }, "Vous devez avoir au moins 18 ans"),
    countryOfResidence: z.string().min(1, "Le pays de résidence est requis"),
    targetCountry: z.string().min(1, "Le pays de destination est requis"),
    targetCity: z.string().min(1, "La ville de destination est requise"),
    selectedServices: z
      .string()
      .min(1, "Veuillez sélectionner au moins un service"),
    monthlyBudget: z.string().optional(),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(128, "Le mot de passe est trop long")
      .refine(validatePasswordStrength, {
        message:
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
      }),
    confirmPassword: z.string(),
    securityQuestion: z.string().min(1, "La question de sécurité est requise"),
    securityAnswer: z
      .string()
      .min(1, "La réponse de sécurité est requise")
      .min(2, "La réponse doit contenir au moins 2 caractères"),
    termsAccepted: z
      .boolean()
      .refine(
        val => val === true,
        "Vous devez accepter les conditions générales"
      ),
    marketingConsent: z.boolean().optional(),
    kycConsent: z
      .boolean()
      .refine(val => val === true, "Vous devez accepter la vérification KYC"),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(128, "Le mot de passe est trop long")
      .refine(validatePasswordStrength, {
        message:
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
      }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .transform(sanitizeString)
    .refine(email => email.length <= 254, "Email trop long"),
});

export const appointmentSchema = z.object({
  requester: z.object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Prénom invalide"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Nom invalide"),
    email: z
      .string()
      .email("Format d'email invalide")
      .transform(sanitizeString)
      .refine(email => email.length <= 254, "Email trop long"),
    phone: z
      .string()
      .transform(phone => phone.replace(/\D/g, ""))
      .refine(phone => {
        const cleaned = phone.replace(/\D/g, "");
        return (
          (cleaned.startsWith("0") && cleaned.length === 10) ||
          (cleaned.startsWith("33") && cleaned.length === 11) ||
          (cleaned.startsWith("+33") && cleaned.length === 12)
        );
      }, "Numéro de téléphone invalide"),
  }),
  recipient: z.object({
    firstName: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Prénom invalide"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom est trop long")
      .transform(sanitizeString)
      .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Nom invalide"),
    phone: z
      .string()
      .transform(phone => phone.replace(/\D/g, ""))
      .refine(phone => {
        const cleaned = phone.replace(/\D/g, "");
        return (
          (cleaned.startsWith("0") && cleaned.length === 10) ||
          (cleaned.startsWith("33") && cleaned.length === 11) ||
          (cleaned.startsWith("+33") && cleaned.length === 12)
        );
      }, "Numéro de téléphone invalide"),
  }),
  timeslot: z.string().min(1, "Veuillez sélectionner un créneau"),
  selectedService: z
    .object({
      id: z.number(),
      name: z.string(),
      price: z.number().positive(),
    })
    .nullable(),
});

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Le numéro de carte est requis")
    .transform(card => card.replace(/\D/g, ""))
    .refine(card => {
      // Algorithme de Luhn pour valider le numéro de carte
      let sum = 0;
      let isEven = false;

      for (let i = card.length - 1; i >= 0; i--) {
        const char = card[i];
        if (char === undefined) continue;
        let digit = parseInt(char, 10);
        if (isNaN(digit)) continue;

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
    }, "Numéro de carte invalide"),
  expiryDate: z
    .string()
    .min(1, "La date d'expiration est requise")
    .refine(date => {
      const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!regex.test(date)) return false;

      const [, month, year] = date.match(regex) || [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      if (!year || !month) return false;

      const expYear = parseInt(year, 10);
      const expMonth = parseInt(month, 10);

      if (isNaN(expYear) || isNaN(expMonth)) return false;

      if (expYear < currentYear) return false;
      if (expYear === currentYear && expMonth < currentMonth) return false;

      return true;
    }, "Date d'expiration invalide"),
  cvv: z
    .string()
    .min(1, "Le code CVV est requis")
    .transform(cvv => cvv.replace(/\D/g, ""))
    .refine(cvv => cvv.length >= 3 && cvv.length <= 4, "Code CVV invalide"),
  cardholderName: z
    .string()
    .min(1, "Le nom du titulaire est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long")
    .transform(sanitizeString)
    .refine(name => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name), "Nom invalide"),
});

// Types TypeScript dérivés des schémas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
