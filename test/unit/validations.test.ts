import {
  validateCardNumber,
  validateCVV,
  validateEmail,
  validateExpiryDate,
  validatePassword,
  validatePhone,
  validateToken,
} from "@/lib/server-validation";
import {
  appointmentSchema,
  loginSchema,
  paymentSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import { describe, expect, it } from "vitest";

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", async () => {
      const validData = {
        email: "test@example.com",
        password: "SecurePass123!",
      };

      const result = await loginSchema.safeParseAsync(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "SecurePass123!",
      };

      const result = await loginSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("should reject short password", async () => {
      const invalidData = {
        email: "test@example.com",
        password: "123",
      };

      const result = await loginSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("should sanitize email input", async () => {
      const dataWithScript = {
        email: "test@example.com<script>alert('xss')</script>",
        password: "SecurePass123!",
      };

      const result = await loginSchema.safeParseAsync(dataWithScript);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", async () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      };

      const result = await registerSchema.safeParseAsync(validData);
      expect(result.success).toBe(true);
    });

    it("should reject weak password", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "weak",
        confirmPassword: "weak",
      };

      const result = await registerSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.path.includes("password"))
        ).toBe(true);
      }
    });

    it("should reject mismatched passwords", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
      };

      const result = await registerSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) =>
            issue.path.includes("confirmPassword")
          )
        ).toBe(true);
      }
    });

    it("should reject invalid phone number", async () => {
      const invalidData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "invalid-phone",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      };

      const result = await registerSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.path.includes("phone"))
        ).toBe(true);
      }
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct reset password data", async () => {
      const validData = {
        password: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      };

      const result = await resetPasswordSchema.safeParseAsync(validData);
      expect(result.success).toBe(true);
    });

    it("should reject weak password", async () => {
      const invalidData = {
        password: "weak",
        confirmPassword: "weak",
      };

      const result = await resetPasswordSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("appointmentSchema", () => {
    it("should validate correct appointment data", async () => {
      const validData = {
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
        timeslot: "2024-01-15T10:00:00Z",
        selectedService: {
          id: 1,
          name: "Service Test",
          price: 100,
        },
      };

      const result = await appointmentSchema.safeParseAsync(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("paymentSchema", () => {
    it("should validate correct payment data", async () => {
      const validData = {
        cardNumber: "4532015112830366", // Visa test card
        expiryDate: "12/25",
        cvv: "123",
        cardholderName: "John Doe",
      };

      const result = await paymentSchema.safeParseAsync(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid card number", async () => {
      const invalidData = {
        cardNumber: "1234567890123456", // Invalid card
        expiryDate: "12/25",
        cvv: "123",
        cardholderName: "John Doe",
      };

      const result = await paymentSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject expired card", async () => {
      const invalidData = {
        cardNumber: "4532015112830366",
        expiryDate: "12/20", // Expired
        cvv: "123",
        cardholderName: "John Doe",
      };

      const result = await paymentSchema.safeParseAsync(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe("Server Validation Functions", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true);
      expect(validateEmail("123@domain.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });

    it("should reject emails that are too long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should validate correct French phone numbers", () => {
      expect(validatePhone("0123456789")).toBe(true);
      expect(validatePhone("33123456789")).toBe(true);
      expect(validatePhone("+33123456789")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false);
      expect(validatePhone("invalid")).toBe(false);
      expect(validatePhone("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should validate strong passwords", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject weak passwords", () => {
      const result = validatePassword("weak");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should provide specific error messages", () => {
      const result = validatePassword("weak");
      expect(result.errors).toContain(
        "Le mot de passe doit contenir au moins 8 caractères"
      );
      expect(result.errors).toContain(
        "Le mot de passe doit contenir au moins une majuscule"
      );
    });
  });

  describe("validateCardNumber", () => {
    it("should validate correct card numbers", () => {
      expect(validateCardNumber("4532015112830366")).toBe(true); // Visa
      expect(validateCardNumber("5555555555554444")).toBe(true); // Mastercard
    });

    it("should reject invalid card numbers", () => {
      expect(validateCardNumber("1234567890123456")).toBe(false);
      expect(validateCardNumber("123")).toBe(false);
      expect(validateCardNumber("")).toBe(false);
    });
  });

  describe("validateExpiryDate", () => {
    it("should validate future expiry dates", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const month = String(futureDate.getMonth() + 1).padStart(2, "0");
      const year = String(futureDate.getFullYear()).slice(-2);

      expect(validateExpiryDate(`${month}/${year}`)).toBe(true);
    });

    it("should reject expired dates", () => {
      expect(validateExpiryDate("12/20")).toBe(false);
    });

    it("should reject invalid formats", () => {
      expect(validateExpiryDate("13/25")).toBe(false);
      expect(validateExpiryDate("00/25")).toBe(false);
      expect(validateExpiryDate("invalid")).toBe(false);
    });
  });

  describe("validateCVV", () => {
    it("should validate correct CVV codes", () => {
      expect(validateCVV("123")).toBe(true);
      expect(validateCVV("1234")).toBe(true);
    });

    it("should reject invalid CVV codes", () => {
      expect(validateCVV("12")).toBe(false);
      expect(validateCVV("12345")).toBe(false);
      expect(validateCVV("abc")).toBe(false);
    });
  });

  describe("validateToken", () => {
    it("should validate correct tokens", () => {
      const validToken = "a".repeat(64);
      expect(validateToken(validToken)).toBe(true);
    });

    it("should reject invalid tokens", () => {
      expect(validateToken("short")).toBe(false);
      expect(validateToken("")).toBe(false);
      expect(validateToken("invalid!@#")).toBe(false);
    });
  });
});
