import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/appointments/[id]/route";

// Mock des données
const mockAppointments = [
  {
    id: "appointment1",
    providerId: "provider1",
    customerId: "customer1",
    serviceType: "immigration",
    appointmentDate: "2024-12-27T10:00:00.000Z",
    duration: 60,
    notes: "Consultation immigration",
    status: "PENDING",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "appointment2",
    providerId: "provider2",
    customerId: "customer2",
    serviceType: "education",
    appointmentDate: "2024-12-28T14:00:00.000Z",
    duration: 90,
    notes: "Consultation éducation",
    status: "CONFIRMED",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
];

// Mock de la fonction findAppointmentById
vi.mock("@/mocks", () => ({
  findAppointmentById: vi.fn((id: string) => {
    return mockAppointments.find(appointment => appointment.id === id);
  }),
}));

describe("GET /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and appointment data for valid ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/appointment1");
    const params = { id: "appointment1" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.appointment).toEqual(mockAppointments[0]);
  });

  it("should return 404 for non-existent appointment ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/nonexistent");
    const params = { id: "nonexistent" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Rendez-vous non trouvé");
  });

  it("should return 200 for another valid appointment ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/appointment2");
    const params = { id: "appointment2" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.appointment).toEqual(mockAppointments[1]);
  });

  it("should handle empty ID parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/");
    const params = { id: "" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Rendez-vous non trouvé");
  });

  it("should handle special characters in ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/special@#$%");
    const params = { id: "special@#$%" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Rendez-vous non trouvé");
  });
});
