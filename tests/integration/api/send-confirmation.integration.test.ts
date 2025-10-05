import { POST } from "@/app/api/send-confirmation/route";
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

describe("POST /api/send-confirmation", () => {
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

  it("should return 200 for valid confirmation request", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
    expect(data.reservationNumber).toMatch(/^RES-\d+-[A-Z0-9]+$/);
  });

  it("should return 400 for missing appointment", async () => {
    const requestBody = {
      paymentData: mockPaymentData,
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
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
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
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
    const requestBody = {};
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
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
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
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
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
  });

  it("should handle appointment without selectedService", async () => {
    const appointmentWithoutService = {
      ...mockAppointment,
      selectedService: null,
    };
    const requestBody = {
      appointment: appointmentWithoutService,
      paymentData: mockPaymentData,
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
  });

  it("should handle malformed JSON", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: "invalid json",
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur lors de l'envoi de l'email");
  });

  it("should generate unique reservation numbers", async () => {
    const requestBody = {
      appointment: mockAppointment,
      paymentData: mockPaymentData,
    };

    // Premier appel
    const request1 = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
    const response1 = await POST(request1);
    const data1 = await response1.json();

    // Deuxième appel
    const request2 = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );
    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(data1.reservationNumber).not.toBe(data2.reservationNumber);
    expect(data1.reservationNumber).toMatch(/^RES-\d+-[A-Z0-9]+$/);
    expect(data2.reservationNumber).toMatch(/^RES-\d+-[A-Z0-9]+$/);
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
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
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
    };
    const request = new NextRequest(
      "http://localhost:3000/api/send-confirmation",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Email de confirmation envoyé avec succès");
  });
});
