import { POST } from "@/app/api/auth/reset-password/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for valid reset password request", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "newSecurePassword123",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Mot de passe réinitialisé avec succès");
  });

  it("should return 400 for missing token", async () => {
    const requestBody = {
      newPassword: "newSecurePassword123",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should return 400 for missing newPassword", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should return 400 for missing both token and newPassword", async () => {
    const requestBody = {};
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should return 400 for password too short", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "short",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Le mot de passe doit contenir au moins 8 caractères"
    );
  });

  it("should return 400 for password exactly 7 characters", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "1234567",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Le mot de passe doit contenir au moins 8 caractères"
    );
  });

  it("should return 200 for password exactly 8 characters", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "12345678",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Mot de passe réinitialisé avec succès");
  });

  it("should return 200 for complex password", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "MySecureP@ssw0rd!",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Mot de passe réinitialisé avec succès");
  });

  it("should handle empty token", async () => {
    const requestBody = {
      token: "",
      newPassword: "newSecurePassword123",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should handle empty password", async () => {
    const requestBody = {
      token: "valid-reset-token-123",
      newPassword: "",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should handle null values", async () => {
    const requestBody = {
      token: null,
      newPassword: null,
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token et nouveau mot de passe requis");
  });

  it("should handle malformed JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: "invalid json",
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur interne du serveur");
  });

  it("should handle special characters in token", async () => {
    const requestBody = {
      token: "token-with-special-chars@#$%^&*()",
      newPassword: "newSecurePassword123",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Mot de passe réinitialisé avec succès");
  });
});
