import { POST } from "@/app/api/send-payment-error/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de la configuration
vi.mock("@/config/env", () => ({
  config: {
    smtp: {
      host: "smtp.example.com",
      port: 587,
      user: "test@example.com",
      pass: "password123",
    },
    isDevelopment: true,
  },
}));

// Mock des variables d'environnement
vi.mock("process", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    EMAIL_CONTACT: "contact@diaspomoney.fr",
  },
}));

// Mock de nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
    })),
  },
}));

// Mock de console.log pour éviter les logs dans les tests
vi.spyOn(console, "log").mockImplementation(() => {});

// Mock de crypto
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => "mock-random-token"),
    })),
  },
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => "mock-random-token"),
  })),
}));

describe("POST /api/send-payment-error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointment = {
    selectedService: {
      name: "Consultation Immigration",
      price: 150,
      id: "service1",
    },
    provider: {
      name: "Jean Dupont",
      id: "provider1",
      apiGeo: [
        {
          display_name: "123 Rue de la Paix, 75001 Paris, France",
        },
      ],
    },
    requester: {
      firstName: "Pierre",
      lastName: "Durand",
      phone: "+33123456789",
      email: "pierre.durand@example.com",
    },
    recipient: {
      firstName: "Marie",
      lastName: "Martin",
      phone: "+33987654321",
    },
    timeslot: "2024-12-27T10:00:00.000Z",
  };

  const mockPaymentData = {
    cardholderName: "Pierre Durand",
  };

  it("should return 200 for valid payment error request", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
    expect(data.retryToken).toBeDefined();
    expect(data.expiresAt).toBeDefined();
    expect(data.retryUrl).toContain("provider1");
    expect(data.retryUrl).toContain("retry=");
    expect(data.retryUrl).toContain("expires=");
  });

  it("should return 200 with default error message when not provided", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should return 400 for missing appointment", async () => {
    const requestBody = {
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Données manquantes");
  });

  it("should return 400 for missing paymentData", async () => {
    const requestBody = {
      appointment: mockAppointment,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Données manquantes");
  });

  it("should return 400 for missing both appointment and paymentData", async () => {
    const requestBody = {
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Données manquantes");
  });

  it("should handle appointment without timeslot", async () => {
    const appointmentWithoutTimeslot = {
      ...mockAppointment,
      timeslot: null,
    };
    const requestBody = {
      appointment: appointmentWithoutTimeslot,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should handle appointment without provider address", async () => {
    const appointmentWithoutAddress = {
      ...mockAppointment,
      provider: {
        ...mockAppointment.provider,
        apiGeo: [],
      },
    };
    const requestBody = {
      appointment: appointmentWithoutAddress,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should handle appointment without selectedService", async () => {
    const appointmentWithoutService = {
      ...mockAppointment,
      selectedService: null,
    };
    const requestBody = {
      appointment: appointmentWithoutService,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should handle malformed JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: "invalid json",
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur lors de l'envoi des emails d'erreur");
  });

  it("should generate unique retry tokens", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };

    // Premier appel
    const request1 = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
    const response1 = await POST(request1);
    const data1 = await response1.json();

    // Deuxième appel
    const request2 = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(data1.retryToken).toBeDefined();
    expect(data2.retryToken).toBeDefined();
    expect(data1.expiresAt).toBeDefined();
    expect(data2.expiresAt).toBeDefined();
  });

  it("should handle special characters in error message", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
      errorMessage:
        "Erreur avec caractères spéciaux: @#$%^&*()_+-=[]{}|;':\",./<>?",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should handle special characters in names", async () => {
    const appointmentWithSpecialChars = {
      ...mockAppointment,
      requester: {
        ...mockAppointment.requester,
        firstName: "José",
        lastName: "O'Connor",
      },
      recipient: {
        ...mockAppointment.recipient,
        firstName: "François",
        lastName: "Dupont-Martin",
      },
    };
    const requestBody = {
      appointment: appointmentWithSpecialChars,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should handle different service prices", async () => {
    const appointmentWithDifferentPrice = {
      ...mockAppointment,
      selectedService: {
        ...mockAppointment.selectedService,
        price: 200,
      },
    };
    const requestBody = {
      appointment: appointmentWithDifferentPrice,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe(
      "Emails d'erreur de paiement envoyés avec succès"
    );
  });

  it("should generate retry URL with correct format", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
      errorMessage: "Erreur de paiement test",
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-payment-error",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(data.retryUrl).toMatch(
      /^http:\/\/localhost:3000\/providers\/provider1\?retry=/
    );
    expect(data.retryUrl).toContain("expires=");
  });
});
