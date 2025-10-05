import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/forgot-password/route";

// Mock des données utilisateurs
const mockUsers = [
  {
    _id: "user1",
    email: "existing@example.com",
    firstName: "Jean",
    lastName: "Dupont",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
  },
  {
    _id: "user2",
    email: "provider@example.com",
    firstName: "Marie",
    lastName: "Martin",
    roles: ["PROVIDER"],
    status: "ACTIVE",
  },
];

// Mock de la fonction findUserByEmail
vi.mock("@/mocks", () => ({
  findUserByEmail: vi.fn((email: string) => {
    return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
  }),
}));

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for existing user email", async () => {
    const requestBody = { email: "existing@example.com" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Si cet email existe, vous recevrez un lien de récupération");
  });

  it("should return 200 for existing user email with different case", async () => {
    const requestBody = { email: "EXISTING@EXAMPLE.COM" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Si cet email existe, vous recevrez un lien de récupération");
  });

  it("should return 200 for non-existing user email (security)", async () => {
    const requestBody = { email: "nonexistent@example.com" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Si cet email existe, vous recevrez un lien de récupération");
  });

  it("should return 400 for missing email", async () => {
    const requestBody = {};
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email requis");
  });

  it("should return 400 for empty email", async () => {
    const requestBody = { email: "" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email requis");
  });

  it("should return 400 for null email", async () => {
    const requestBody = { email: null };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email requis");
  });

  it("should return 200 for provider email", async () => {
    const requestBody = { email: "provider@example.com" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Si cet email existe, vous recevrez un lien de récupération");
  });

  it("should handle malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur interne du serveur");
  });

  it("should handle special characters in email", async () => {
    const requestBody = { email: "test+tag@example.com" };
    const request = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Si cet email existe, vous recevrez un lien de récupération");
  });
});
