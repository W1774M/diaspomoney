import { forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { loginHandler } from "@/app/api/auth/login/route";
import { registerHandler } from "@/app/api/auth/register/route";
import { resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { RetryToken } from "@/models/RetryToken";
import { User } from "@/models/User";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await RetryToken.deleteMany({});
});

describe("Auth API Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "0123456789",
          password: "SecurePass123!",
        },
      });

      await registerHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("john.doe@example.com");
      expect(data.user.password).toBeUndefined(); // Password should not be returned
    });

    it("should reject registration with invalid data", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          firstName: "J",
          lastName: "D",
          email: "invalid-email",
          phone: "invalid-phone",
          password: "weak",
        },
      });

      await registerHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it("should reject registration with existing email", async () => {
      // Create existing user
      await User.create({
        firstName: "Jane",
        lastName: "Smith",
        email: "john.doe@example.com",
        phone: "0987654321",
        password: "SecurePass123!",
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "0123456789",
          password: "SecurePass123!",
        },
      });

      await registerHandler(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("existe déjà");
    });

    it("should reject weak password", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "0123456789",
          password: "weak",
        },
      });

      await registerHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toContain("majuscule");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "john.doe@example.com",
          password: "SecurePass123!",
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("john.doe@example.com");
      expect(data.user.password).toBeUndefined();
    });

    it("should reject login with incorrect password", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "john.doe@example.com",
          password: "WrongPassword123!",
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("incorrect");
    });

    it("should reject login with non-existent email", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "nonexistent@example.com",
          password: "SecurePass123!",
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("trouvé");
    });

    it("should reject login with invalid data", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "invalid-email",
          password: "",
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
      });
    });

    it("should send reset email for existing user", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "john.doe@example.com",
        },
      });

      await forgotPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain("envoyé");
    });

    it("should not reveal if email exists", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "nonexistent@example.com",
        },
      });

      await forgotPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain("envoyé");
    });

    it("should reject invalid email", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          email: "invalid-email",
        },
      });

      await forgotPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/reset-password", () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create test user and token
      const user = await User.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0123456789",
        password: "SecurePass123!",
      });

      const token = await RetryToken.create({
        userId: user._id,
        token: "test-reset-token-123",
        type: "password-reset",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      resetToken = token.token;
    });

    it("should reset password successfully with valid token", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          token: resetToken,
          password: "NewSecurePass123!",
        },
      });

      await resetPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain("réinitialisé");
    });

    it("should reject invalid token", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          token: "invalid-token",
          password: "NewSecurePass123!",
        },
      });

      await resetPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("invalide");
    });

    it("should reject weak password", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          token: resetToken,
          password: "weak",
        },
      });

      await resetPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });

    it("should reject expired token", async () => {
      // Create expired token
      const user = await User.findOne({ email: "john.doe@example.com" });
      await RetryToken.create({
        userId: user!._id,
        token: "expired-token",
        type: "password-reset",
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          token: "expired-token",
          password: "NewSecurePass123!",
        },
      });

      await resetPasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain("expiré");
    });
  });
});
