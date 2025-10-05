import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock des modules au niveau supérieur
vi.mock("@/mocks", () => ({
  MOCK_USERS: [
    {
      id: "existing_user",
      email: "existing@example.com",
      password: "ExistingPassword123!",
      firstName: "Existing",
      lastName: "User",
      roles: ["CUSTOMER"],
      status: "ACTIVE",
    },
  ],
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        // Missing required fields
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Tous les champs obligatoires doivent être remplis"
    );
  });

  it("should return 400 for password too short", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "123", // Too short
        phone: "+1234567890",
        dateOfBirth: "1990-01-01",
        countryOfResidence: "France",
        targetCountry: "Canada",
        targetCity: "Montreal",
        selectedServices: ["immigration"],
        securityQuestion: "What is your mother's maiden name?",
        securityAnswer: "Smith",
        termsAccepted: true,
        kycConsent: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Le mot de passe doit contenir au moins 8 caractères"
    );
  });

  it("should return 400 for underage user", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "ValidPassword123!",
        phone: "+1234567890",
        dateOfBirth: "2010-01-01", // Under 18
        countryOfResidence: "France",
        targetCountry: "Canada",
        targetCity: "Montreal",
        selectedServices: ["immigration"],
        securityQuestion: "What is your mother's maiden name?",
        securityAnswer: "Smith",
        termsAccepted: true,
        kycConsent: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Vous devez avoir au moins 18 ans pour créer un compte"
    );
  });

  it("should return 409 for existing email", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "existing@example.com", // Already exists
        password: "ValidPassword123!",
        phone: "+1234567890",
        dateOfBirth: "1990-01-01",
        countryOfResidence: "France",
        targetCountry: "Canada",
        targetCity: "Montreal",
        selectedServices: ["immigration"],
        securityQuestion: "What is your mother's maiden name?",
        securityAnswer: "Smith",
        termsAccepted: true,
        kycConsent: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Un compte avec cet email existe déjà");
  });

  it("should return 201 for valid registration", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "newuser@example.com",
        password: "ValidPassword123!",
        phone: "+1234567890",
        dateOfBirth: "1990-01-01",
        countryOfResidence: "France",
        targetCountry: "Canada",
        targetCity: "Montreal",
        selectedServices: ["immigration", "education"],
        securityQuestion: "What is your mother's maiden name?",
        securityAnswer: "Smith",
        termsAccepted: true,
        kycConsent: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("newuser@example.com");
    expect(data.user.roles).toEqual(["CUSTOMER"]);
    expect(data.user.status).toBe("PENDING");
    expect(data.user.isEmailVerified).toBe(false);
    expect(data.message).toContain("Compte créé avec succès");
  });
});
