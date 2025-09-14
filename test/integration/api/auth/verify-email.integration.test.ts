import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/verify-email/route";

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for valid verification token", async () => {
    const requestBody = {
      token: "valid-verification-token-123",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should return 400 for missing token", async () => {
    const requestBody = {};
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token requis");
  });

  it("should return 400 for empty token", async () => {
    const requestBody = {
      token: "",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token requis");
  });

  it("should return 400 for null token", async () => {
    const requestBody = {
      token: null,
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token requis");
  });

  it("should return 200 for long token", async () => {
    const requestBody = {
      token: "a".repeat(1000),
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should return 200 for token with special characters", async () => {
    const requestBody = {
      token: "token-with-special-chars@#$%^&*()_+-=[]{}|;':\",./<>?",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should return 200 for token with spaces", async () => {
    const requestBody = {
      token: "token with spaces",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should return 200 for token with unicode characters", async () => {
    const requestBody = {
      token: "token-with-unicode-éèàçñüöäëï",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should return 200 for numeric token", async () => {
    const requestBody = {
      token: "123456789",
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });

  it("should handle malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur interne du serveur");
  });

  it("should handle additional fields in request body", async () => {
    const requestBody = {
      token: "valid-verification-token-123",
      additionalField: "some value",
      anotherField: 123,
    };
    const request = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email vérifié avec succès");
  });
});
