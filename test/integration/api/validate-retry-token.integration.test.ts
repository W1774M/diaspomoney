import { GET } from "@/app/api/validate-retry-token/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GET /api/validate-retry-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for valid token and future expiration", async () => {
    const futureTime = Date.now() + 60000; // 1 minute in the future
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=${futureTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Token valide");
    expect(data.token).toBe("valid-token-123");
    expect(data.valid).toBe(true);
    expect(data.expiresAt).toBeDefined();
  });

  it("should return 410 for expired token", async () => {
    const pastTime = Date.now() - 60000; // 1 minute in the past
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=expired-token-123&expires=${pastTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Token expiré");
    expect(data.message).toBe(
      "Le lien de retry a expiré. Veuillez refaire votre réservation."
    );
    expect(data.expired).toBe(true);
  });

  it("should return 400 for missing token", async () => {
    const futureTime = Date.now() + 60000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?expires=${futureTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token ou date d'expiration manquant");
  });

  it("should return 400 for missing expires", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/validate-retry-token?token=valid-token-123"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token ou date d'expiration manquant");
  });

  it("should return 400 for missing both token and expires", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/validate-retry-token"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Token ou date d'expiration manquant");
  });

  it("should return 410 for token expiring exactly now", async () => {
    const now = Date.now();
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=expiring-token-123&expires=${now}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Token expiré");
    expect(data.expired).toBe(true);
  });

  it("should return 200 for token with special characters", async () => {
    const futureTime = Date.now() + 60000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=token-with-special-chars&expires=${futureTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe("token-with-special-chars");
    expect(data.valid).toBe(true);
  });

  it("should return 200 for token with spaces", async () => {
    const futureTime = Date.now() + 60000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=token with spaces&expires=${futureTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe("token with spaces");
    expect(data.valid).toBe(true);
  });

  it("should return 200 for token with unicode characters", async () => {
    const futureTime = Date.now() + 60000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=token-with-unicode-éèàçñüöäëï&expires=${futureTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe("token-with-unicode-éèàçñüöäëï");
    expect(data.valid).toBe(true);
  });

  it("should handle invalid expires parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=invalid-date"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur lors de la validation du token");
  });

  it("should handle very large expires value", async () => {
    const veryLargeTime = Number.MAX_SAFE_INTEGER;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=${veryLargeTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur lors de la validation du token");
  });

  it("should handle negative expires value", async () => {
    const negativeTime = -1000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=${negativeTime}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Token expiré");
    expect(data.expired).toBe(true);
  });

  it("should handle zero expires value", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=0"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Token expiré");
    expect(data.expired).toBe(true);
  });

  it("should handle additional query parameters", async () => {
    const futureTime = Date.now() + 60000;
    const request = new NextRequest(
      `http://localhost:3000/api/validate-retry-token?token=valid-token-123&expires=${futureTime}&additional=param&another=value`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe("valid-token-123");
    expect(data.valid).toBe(true);
  });
});
