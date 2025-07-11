import { sanitizeInput, validateAndSanitize } from "@/lib/server-validation";
import {
  createSession,
  destroySession,
  validateSession,
} from "@/lib/session-security";
import { loginSchema, registerSchema } from "@/lib/validations";
import { addSecurityHeaders, securityMiddleware } from "@/middleware/security";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

// Mock NextRequest
const createMockRequest = (
  overrides: Partial<NextRequest> = {}
): NextRequest => {
  return {
    nextUrl: new URL("http://localhost:3000/test"),
    method: "GET",
    headers: new Headers(),
    cookies: new Map(),
    ip: "127.0.0.1",
    ...overrides,
  } as NextRequest;
};

describe("Security Tests", () => {
  describe("Middleware Security", () => {
    it("should block suspicious user agents", () => {
      const suspiciousRequest = createMockRequest({
        headers: new Headers({
          "user-agent": "<script>alert('xss')</script>",
        }),
      });

      const response = securityMiddleware(suspiciousRequest);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(400);
    });

    it("should block path traversal attempts", () => {
      const traversalRequest = createMockRequest({
        nextUrl: new URL("http://localhost:3000/../../../etc/passwd"),
      });

      const response = securityMiddleware(traversalRequest);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(400);
    });

    it("should allow legitimate requests", () => {
      const legitimateRequest = createMockRequest({
        headers: new Headers({
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }),
      });

      const response = securityMiddleware(legitimateRequest);
      expect(response).toBeNull();
    });

    it("should add security headers", () => {
      const response = new Response();
      const securedResponse = addSecurityHeaders(response);

      expect(securedResponse.headers.get("X-Frame-Options")).toBe("DENY");
      expect(securedResponse.headers.get("X-Content-Type-Options")).toBe(
        "nosniff"
      );
      expect(securedResponse.headers.get("X-XSS-Protection")).toBe(
        "1; mode=block"
      );
      expect(
        securedResponse.headers.get("Content-Security-Policy")
      ).toBeDefined();
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML tags", () => {
      const input = "Hello<script>alert('xss')</script>World";
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe("HelloWorld");
    });

    it("should sanitize JavaScript protocols", () => {
      const input = "javascript:alert('xss')";
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe("alert('xss')");
    });

    it("should sanitize inline events", () => {
      const input = "onclick=alert('xss')";
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe("");
    });

    it("should sanitize nested objects", () => {
      const input = {
        name: "John<script>alert('xss')</script>",
        email: "john@example.com",
        bio: "onclick=alert('xss')",
      };

      const sanitized = sanitizeInput(input);
      expect(sanitized.name).toBe("John");
      expect(sanitized.email).toBe("john@example.com");
      expect(sanitized.bio).toBe("");
    });

    it("should sanitize arrays", () => {
      const input = [
        "Hello<script>alert('xss')</script>",
        "World",
        "onclick=alert('xss')",
      ];

      const sanitized = sanitizeInput(input);
      expect(sanitized).toEqual(["Hello", "World", ""]);
    });
  });

  describe("Validation and Sanitization", () => {
    it("should validate and sanitize login data", async () => {
      const input = {
        email: "test@example.com<script>alert('xss')</script>",
        password: "SecurePass123!",
      };

      const result = await validateAndSanitize(loginSchema, input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should reject invalid login data", async () => {
      const input = {
        email: "invalid-email",
        password: "weak",
      };

      const result = await validateAndSanitize(loginSchema, input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should validate and sanitize registration data", async () => {
      const input = {
        firstName: "John<script>alert('xss')</script>",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      };

      const result = await validateAndSanitize(registerSchema, input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
      }
    });
  });

  describe("Session Security", () => {
    it("should create secure sessions", () => {
      const userId = "user123";
      const ip = "127.0.0.1";
      const userAgent = "Mozilla/5.0";

      const session = createSession(userId, ip, userAgent);
      expect(session.sessionId).toBeDefined();
      expect(session.refreshToken).toBeDefined();
      expect(session.sessionId.length).toBeGreaterThan(32);
      expect(session.refreshToken.length).toBeGreaterThan(64);
    });

    it("should validate active sessions", () => {
      const userId = "user123";
      const ip = "127.0.0.1";
      const userAgent = "Mozilla/5.0";

      const session = createSession(userId, ip, userAgent);
      const validation = validateSession(session.sessionId, ip);

      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(userId);
    });

    it("should reject invalid session IDs", () => {
      const validation = validateSession("invalid-session-id", "127.0.0.1");
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("Session invalide");
    });

    it("should destroy sessions", () => {
      const userId = "user123";
      const ip = "127.0.0.1";
      const userAgent = "Mozilla/5.0";

      const session = createSession(userId, ip, userAgent);
      const destroyed = destroySession(session.sessionId);
      expect(destroyed).toBe(true);

      const validation = validateSession(session.sessionId, ip);
      expect(validation.valid).toBe(false);
    });
  });

  describe("Password Security", () => {
    it("should validate strong passwords", () => {
      const strongPasswords = [
        "SecurePass123!",
        "MyP@ssw0rd2024",
        "Complex#Password1",
      ];

      strongPasswords.forEach((password) => {
        const result = validateAndSanitize(registerSchema, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "0123456789",
          password,
          confirmPassword: password,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject weak passwords", () => {
      const weakPasswords = ["weak", "123456", "password", "qwerty", "abc123"];

      weakPasswords.forEach((password) => {
        const result = validateAndSanitize(registerSchema, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "0123456789",
          password,
          confirmPassword: password,
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject common passwords", () => {
      const commonPasswords = [
        "password",
        "123456",
        "123456789",
        "qwerty",
        "abc123",
      ];

      commonPasswords.forEach((password) => {
        const result = validateAndSanitize(registerSchema, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "0123456789",
          password,
          confirmPassword: password,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Email Security", () => {
    it("should validate correct email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name+tag@domain.co.uk",
        "123@domain.org",
        "user-name@domain.com",
      ];

      validEmails.forEach((email) => {
        const result = validateAndSanitize(loginSchema, {
          email,
          password: "SecurePass123!",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user.domain.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        const result = validateAndSanitize(loginSchema, {
          email,
          password: "SecurePass123!",
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject emails that are too long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validateAndSanitize(loginSchema, {
        email: longEmail,
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Phone Number Security", () => {
    it("should validate correct French phone numbers", () => {
      const validPhones = ["0123456789", "33123456789", "+33123456789"];

      validPhones.forEach((phone) => {
        const result = validateAndSanitize(registerSchema, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone,
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhones = [
        "123",
        "invalid",
        "",
        "12345678901234567890", // Too long
      ];

      invalidPhones.forEach((phone) => {
        const result = validateAndSanitize(registerSchema, {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone,
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should track requests per IP", () => {
      const ip = "127.0.0.1";
      const path = "/api/auth/login";

      // Simulate multiple requests
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          headers: new Headers({
            "x-forwarded-for": ip,
          }),
          nextUrl: new URL(`http://localhost:3000${path}`),
        });

        const response = securityMiddleware(request);
        if (i < 4) {
          expect(response).toBeNull(); // Should allow first 4 requests
        } else {
          expect(response?.status).toBe(429); // Should block 5th request
        }
      }
    });
  });
});
