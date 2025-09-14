import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  appointmentSchema,
  paymentSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type ForgotPasswordFormData,
  type AppointmentFormData,
  type PaymentFormData,
} from "@/lib/validations";

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("should sanitize email input", () => {
      const dataWithHtml = {
        email: "test<script>@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(dataWithHtml);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format d'email invalide");
      }
    });

    it("should reject empty email", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("L'email est requis");
      }
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format d'email invalide");
      }
    });

    it("should reject email that is too long", () => {
      const longEmail = "a".repeat(255) + "@example.com";
      const invalidData = {
        email: longEmail,
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email trop long");
      }
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le mot de passe est requis");
      }
    });

    it("should reject password that is too short", () => {
      const invalidData = {
        email: "test@example.com",
        password: "123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le mot de passe doit contenir au moins 8 caractères");
      }
    });

    it("should reject password that is too long", () => {
      const longPassword = "a".repeat(129);
      const invalidData = {
        email: "test@example.com",
        password: longPassword,
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le mot de passe est trop long");
      }
    });
  });

  describe("registerSchema", () => {
    const validRegisterData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "0123456789",
      dateOfBirth: "1990-01-01",
      countryOfResidence: "France",
      targetCountry: "Canada",
      targetCity: "Toronto",
      selectedServices: "medical",
      monthlyBudget: "5000",
      password: "StrongPass123!",
      confirmPassword: "StrongPass123!",
      securityQuestion: "What is your favorite color?",
      securityAnswer: "Blue",
      termsAccepted: true,
      marketingConsent: false,
      kycConsent: true,
    };

    it("should validate correct register data", () => {
      const result = registerSchema.safeParse(validRegisterData);
      expect(result.success).toBe(true);
    });

    it("should sanitize name inputs", () => {
      const dataWithHtml = {
        ...validRegisterData,
        firstName: "John<script>",
        lastName: "Doe<script>",
      };

      const result = registerSchema.safeParse(dataWithHtml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
        expect(result.data.lastName).toBe("Doe");
      }
    });

    it("should reject invalid first name", () => {
      const invalidData = {
        ...validRegisterData,
        firstName: "J", // Too short
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le prénom doit contenir au moins 2 caractères");
      }
    });

    it("should reject first name with invalid characters", () => {
      const invalidData = {
        ...validRegisterData,
        firstName: "John123", // Contains numbers
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Prénom invalide");
      }
    });

    it("should reject first name that is too long", () => {
      const longName = "a".repeat(51);
      const invalidData = {
        ...validRegisterData,
        firstName: longName,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le prénom est trop long");
      }
    });

    it("should reject invalid phone number", () => {
      const invalidData = {
        ...validRegisterData,
        phone: "123", // Too short
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Numéro de téléphone invalide");
      }
    });

    it("should accept valid French phone numbers", () => {
      const validPhones = [
        "0123456789", // 0 + 9 digits
        "33123456789", // 33 + 9 digits
        "+33123456789", // +33 + 9 digits
      ];

      validPhones.forEach(phone => {
        const data = { ...validRegisterData, phone };
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject underage users", () => {
      const invalidData = {
        ...validRegisterData,
        dateOfBirth: "2010-01-01", // 14 years old
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Vous devez avoir au moins 18 ans");
      }
    });

    it("should reject users that are too old", () => {
      const invalidData = {
        ...validRegisterData,
        dateOfBirth: "1900-01-01", // 124 years old
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Vous devez avoir au moins 18 ans");
      }
    });

    it("should reject weak passwords", () => {
      const weakPasswords = [
        "weak", // Too short
        "WeakPass", // No numbers or special chars
        "WeakPass1", // No special chars
        "WeakPass!", // No numbers
      ];

      weakPasswords.forEach(password => {
        const data = { ...validRegisterData, password, confirmPassword: password };
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          // Check if it's a length error or complexity error
          const errorMessage = result.error.issues[0].message;
          expect(
            errorMessage.includes("Le mot de passe doit contenir au moins 8 caractères") ||
            errorMessage.includes("Le mot de passe doit contenir au moins une majuscule")
          ).toBe(true);
        }
      });
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        ...validRegisterData,
        password: "StrongPass123!",
        confirmPassword: "DifferentPass123!",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Les mots de passe ne correspondent pas");
      }
    });

    it("should reject when terms are not accepted", () => {
      const invalidData = {
        ...validRegisterData,
        termsAccepted: false,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Vous devez accepter les conditions générales");
      }
    });

    it("should reject when KYC consent is not given", () => {
      const invalidData = {
        ...validRegisterData,
        kycConsent: false,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Vous devez accepter la vérification KYC");
      }
    });

    it("should accept valid names with accents and special characters", () => {
      const validNames = [
        "Jean-Pierre",
        "Marie-Claire",
        "François",
        "José",
        "O'Connor",
        "van der Berg",
      ];

      validNames.forEach(name => {
        const data = { ...validRegisterData, firstName: name };
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct reset password data", () => {
      const validData = {
        password: "NewStrongPass123!",
        confirmPassword: "NewStrongPass123!",
      };

      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject weak passwords", () => {
      const weakPassword = "weakpass";
      const invalidData = {
        password: weakPassword,
        confirmPassword: weakPassword,
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Le mot de passe doit contenir au moins une majuscule");
      }
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        password: "StrongPass123!",
        confirmPassword: "DifferentPass123!",
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Les mots de passe ne correspondent pas");
      }
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should validate correct forgot password data", () => {
      const validData = {
        email: "test@example.com",
      };

      const result = forgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should sanitize email input", () => {
      const dataWithHtml = {
        email: "test<script>@example.com",
      };

      const result = forgotPasswordSchema.safeParse(dataWithHtml);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format d'email invalide");
      }
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format d'email invalide");
      }
    });
  });

  describe("appointmentSchema", () => {
    const validAppointmentData = {
      requester: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
      },
      recipient: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "0987654321",
      },
      timeslot: "2024-01-15T10:00:00",
      selectedService: {
        id: 1,
        name: "Medical Consultation",
        price: 100,
      },
    };

    it("should validate correct appointment data", () => {
      const result = appointmentSchema.safeParse(validAppointmentData);
      expect(result.success).toBe(true);
    });

    it("should sanitize name inputs", () => {
      const dataWithHtml = {
        ...validAppointmentData,
        requester: {
          ...validAppointmentData.requester,
          firstName: "John<script>",
        },
      };

      const result = appointmentSchema.safeParse(dataWithHtml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requester.firstName).toBe("John");
      }
    });

    it("should reject invalid phone numbers", () => {
      const invalidData = {
        ...validAppointmentData,
        requester: {
          ...validAppointmentData.requester,
          phone: "123",
        },
      };

      const result = appointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Numéro de téléphone invalide");
      }
    });

    it("should accept null selected service", () => {
      const dataWithNullService = {
        ...validAppointmentData,
        selectedService: null,
      };

      const result = appointmentSchema.safeParse(dataWithNullService);
      expect(result.success).toBe(true);
    });

    it("should validate service structure", () => {
      const invalidService = {
        id: "invalid", // Should be number
        name: "Service Name",
        price: -100, // Should be positive
      };

      const invalidData = {
        ...validAppointmentData,
        selectedService: invalidService,
      };

      const result = appointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("paymentSchema", () => {
    const validPaymentData = {
      cardNumber: "4532015112830366", // Valid Visa card
      expiryDate: "12/25",
      cvv: "123",
      cardholderName: "John Doe",
    };

    it("should validate correct payment data", () => {
      const result = paymentSchema.safeParse(validPaymentData);
      expect(result.success).toBe(true);
    });

    it("should sanitize card number input", () => {
      const dataWithSpaces = {
        ...validPaymentData,
        cardNumber: "4532 0151 1283 0366",
      };

      const result = paymentSchema.safeParse(dataWithSpaces);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cardNumber).toBe("4532015112830366");
      }
    });

    it("should reject invalid card number (Luhn algorithm)", () => {
      const invalidData = {
        ...validPaymentData,
        cardNumber: "4532015112830367", // Invalid checksum
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Numéro de carte invalide");
      }
    });

    it("should reject expired card", () => {
      const expiredDate = "01/20"; // January 2020
      const invalidData = {
        ...validPaymentData,
        expiryDate: expiredDate,
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Date d'expiration invalide");
      }
    });

    it("should reject invalid expiry date format", () => {
      const invalidFormats = [
        "13/25", // Invalid month
        "12/5", // Invalid year format
        "12-25", // Wrong separator
        "December 2025", // Wrong format
      ];

      invalidFormats.forEach(format => {
        const invalidData = {
          ...validPaymentData,
          expiryDate: format,
        };

        const result = paymentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Date d'expiration invalide");
        }
      });
    });

    it("should reject invalid CVV", () => {
      const invalidCVVs = [
        "12", // Too short
        "12345", // Too long
        "abc", // Non-numeric
      ];

      invalidCVVs.forEach(cvv => {
        const invalidData = {
          ...validPaymentData,
          cvv,
        };

        const result = paymentSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Code CVV invalide");
        }
      });
    });

    it("should sanitize CVV input", () => {
      const dataWithSpaces = {
        ...validPaymentData,
        cvv: "12 3",
      };

      const result = paymentSchema.safeParse(dataWithSpaces);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cvv).toBe("123");
      }
    });

    it("should sanitize cardholder name", () => {
      const dataWithHtml = {
        ...validPaymentData,
        cardholderName: "John<script>Doe",
      };

      const result = paymentSchema.safeParse(dataWithHtml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cardholderName).toBe("JohnDoe");
      }
    });

    it("should reject cardholder name that is too short", () => {
      const invalidData = {
        ...validPaymentData,
        cardholderName: "J",
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le nom doit contenir au moins 2 caractères");
      }
    });

    it("should reject cardholder name that is too long", () => {
      const longName = "a".repeat(101);
      const invalidData = {
        ...validPaymentData,
        cardholderName: longName,
      };

      const result = paymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le nom est trop long");
      }
    });

    it("should accept valid cardholder names with accents and special characters", () => {
      const validNames = [
        "Jean-Pierre Dupont",
        "Maria José Silva",
        "O'Connor",
        "van der Berg",
        "François-Xavier",
      ];

      validNames.forEach(name => {
        const data = { ...validPaymentData, cardholderName: name };
        const result = paymentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should validate various valid card numbers", () => {
      const validCards = [
        "4532015112830366", // Visa
        "5555555555554444", // Mastercard
        "378282246310005", // American Express
        "6011111111111117", // Discover
      ];

      validCards.forEach(cardNumber => {
        const data = { ...validPaymentData, cardNumber };
        const result = paymentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("TypeScript types", () => {
    it("should have correct LoginFormData type", () => {
      const loginData: LoginFormData = {
        email: "test@example.com",
        password: "password123",
      };

      expect(loginData).toHaveProperty("email");
      expect(loginData).toHaveProperty("password");
      expect(typeof loginData.email).toBe("string");
      expect(typeof loginData.password).toBe("string");
    });

    it("should have correct RegisterFormData type", () => {
      const registerData: RegisterFormData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        dateOfBirth: "1990-01-01",
        countryOfResidence: "France",
        targetCountry: "Canada",
        targetCity: "Toronto",
        selectedServices: "medical",
        monthlyBudget: "5000",
        password: "StrongPass123!",
        confirmPassword: "StrongPass123!",
        securityQuestion: "What is your favorite color?",
        securityAnswer: "Blue",
        termsAccepted: true,
        marketingConsent: false,
        kycConsent: true,
      };

      expect(registerData).toHaveProperty("firstName");
      expect(registerData).toHaveProperty("lastName");
      expect(registerData).toHaveProperty("email");
      expect(registerData).toHaveProperty("phone");
      expect(registerData).toHaveProperty("dateOfBirth");
      expect(registerData).toHaveProperty("countryOfResidence");
      expect(registerData).toHaveProperty("targetCountry");
      expect(registerData).toHaveProperty("targetCity");
      expect(registerData).toHaveProperty("selectedServices");
      expect(registerData).toHaveProperty("monthlyBudget");
      expect(registerData).toHaveProperty("password");
      expect(registerData).toHaveProperty("confirmPassword");
      expect(registerData).toHaveProperty("securityQuestion");
      expect(registerData).toHaveProperty("securityAnswer");
      expect(registerData).toHaveProperty("termsAccepted");
      expect(registerData).toHaveProperty("marketingConsent");
      expect(registerData).toHaveProperty("kycConsent");
    });

    it("should have correct ResetPasswordFormData type", () => {
      const resetData: ResetPasswordFormData = {
        password: "NewStrongPass123!",
        confirmPassword: "NewStrongPass123!",
      };

      expect(resetData).toHaveProperty("password");
      expect(resetData).toHaveProperty("confirmPassword");
      expect(typeof resetData.password).toBe("string");
      expect(typeof resetData.confirmPassword).toBe("string");
    });

    it("should have correct ForgotPasswordFormData type", () => {
      const forgotData: ForgotPasswordFormData = {
        email: "test@example.com",
      };

      expect(forgotData).toHaveProperty("email");
      expect(typeof forgotData.email).toBe("string");
    });

    it("should have correct AppointmentFormData type", () => {
      const appointmentData: AppointmentFormData = {
        requester: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "0123456789",
        },
        recipient: {
          firstName: "Jane",
          lastName: "Smith",
          phone: "0987654321",
        },
        timeslot: "2024-01-15T10:00:00",
        selectedService: {
          id: 1,
          name: "Medical Consultation",
          price: 100,
        },
      };

      expect(appointmentData).toHaveProperty("requester");
      expect(appointmentData).toHaveProperty("recipient");
      expect(appointmentData).toHaveProperty("timeslot");
      expect(appointmentData).toHaveProperty("selectedService");
      expect(appointmentData.requester).toHaveProperty("firstName");
      expect(appointmentData.requester).toHaveProperty("lastName");
      expect(appointmentData.requester).toHaveProperty("email");
      expect(appointmentData.requester).toHaveProperty("phone");
      expect(appointmentData.recipient).toHaveProperty("firstName");
      expect(appointmentData.recipient).toHaveProperty("lastName");
      expect(appointmentData.recipient).toHaveProperty("phone");
      expect(appointmentData.selectedService).toHaveProperty("id");
      expect(appointmentData.selectedService).toHaveProperty("name");
      expect(appointmentData.selectedService).toHaveProperty("price");
    });

    it("should have correct PaymentFormData type", () => {
      const paymentData: PaymentFormData = {
        cardNumber: "4532015112830366",
        expiryDate: "12/25",
        cvv: "123",
        cardholderName: "John Doe",
      };

      expect(paymentData).toHaveProperty("cardNumber");
      expect(paymentData).toHaveProperty("expiryDate");
      expect(paymentData).toHaveProperty("cvv");
      expect(paymentData).toHaveProperty("cardholderName");
      expect(typeof paymentData.cardNumber).toBe("string");
      expect(typeof paymentData.expiryDate).toBe("string");
      expect(typeof paymentData.cvv).toBe("string");
      expect(typeof paymentData.cardholderName).toBe("string");
    });
  });
});
