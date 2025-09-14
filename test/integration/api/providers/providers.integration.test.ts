import { GET, POST } from "@/app/api/providers/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock des modules au niveau supérieur
vi.mock('@/mocks', () => ({
  MOCK_USERS: [
    {
      id: "provider1",
      email: "provider1@example.com",
      firstName: "John",
      lastName: "Provider",
      roles: ["PROVIDER"],
      status: "ACTIVE"
    },
    {
      id: "provider2",
      email: "provider2@example.com",
      firstName: "Jane",
      lastName: "Provider",
      roles: ["PROVIDER"],
      status: "PENDING"
    },
    {
      id: "customer1",
      email: "customer@example.com",
      firstName: "Bob",
      lastName: "Customer",
      roles: ["CUSTOMER"],
      status: "ACTIVE"
    }
  ]
}));

describe("GET /api/providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all providers successfully", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.providers).toBeDefined();
    expect(Array.isArray(data.providers)).toBe(true);
    expect(data.providers).toHaveLength(2); // Only users with PROVIDER role
    expect(data.total).toBe(2);
    expect(data.providers.every((provider: any) => provider.roles.includes("PROVIDER"))).toBe(true);
  });
});

describe("POST /api/providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers", {
      method: "POST",
      body: JSON.stringify({
        specialities: ["immigration"]
        // Missing userId
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Données de prestataire incomplètes");
  });

  it("should return 201 for valid provider creation", async () => {
    const providerData = {
      userId: "user1",
      specialities: ["immigration", "education"],
      experience: 5,
      languages: ["French", "English"],
      certifications: ["Immigration Consultant"],
      availability: {
        monday: ["09:00-12:00", "14:00-17:00"],
        tuesday: ["09:00-12:00", "14:00-17:00"]
      },
      hourlyRate: 150
    };

    const request = new NextRequest("http://localhost:3000/api/providers", {
      method: "POST",
      body: JSON.stringify(providerData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.provider).toBeDefined();
    expect(data.provider.userId).toBe(providerData.userId);
    expect(data.provider.specialities).toEqual(providerData.specialities);
    expect(data.provider.status).toBe("PENDING");
    expect(data.provider.id).toBeDefined();
    expect(data.message).toBe("Prestataire créé avec succès");
  });
});
