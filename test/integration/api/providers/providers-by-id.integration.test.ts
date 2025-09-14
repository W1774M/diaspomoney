import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/providers/[id]/route";

// Mock des données utilisateurs
const mockUsers = [
  {
    _id: "provider1",
    email: "provider1@example.com",
    firstName: "Jean",
    lastName: "Dupont",
    roles: ["PROVIDER"],
    status: "ACTIVE",
    specialities: ["immigration", "education"],
    experience: 5,
    languages: ["French", "English"],
    certifications: ["Immigration Consultant"],
    availability: {
      monday: ["09:00-12:00", "14:00-17:00"],
      tuesday: ["09:00-12:00", "14:00-17:00"],
    },
    hourlyRate: 150,
  },
  {
    _id: "provider2",
    email: "provider2@example.com",
    firstName: "Marie",
    lastName: "Martin",
    roles: ["PROVIDER"],
    status: "ACTIVE",
    specialities: ["education"],
    experience: 3,
    languages: ["French"],
    certifications: ["Education Consultant"],
    availability: {
      wednesday: ["10:00-16:00"],
      thursday: ["10:00-16:00"],
    },
    hourlyRate: 120,
  },
  {
    _id: "customer1",
    email: "customer1@example.com",
    firstName: "Pierre",
    lastName: "Durand",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
  },
];

// Mock de MOCK_USERS
vi.mock("@/mocks", () => {
  const mockUsers = [
    {
      _id: "provider1",
      email: "provider1@example.com",
      firstName: "Jean",
      lastName: "Dupont",
      roles: ["PROVIDER"],
      status: "ACTIVE",
      specialities: ["immigration", "education"],
      experience: 5,
      languages: ["French", "English"],
      certifications: ["Immigration Consultant"],
      availability: {
        monday: ["09:00-12:00", "14:00-17:00"],
        tuesday: ["09:00-12:00", "14:00-17:00"],
      },
      hourlyRate: 150,
    },
    {
      _id: "provider2",
      email: "provider2@example.com",
      firstName: "Marie",
      lastName: "Martin",
      roles: ["PROVIDER"],
      status: "ACTIVE",
      specialities: ["education"],
      experience: 3,
      languages: ["French"],
      certifications: ["Education Consultant"],
      availability: {
        wednesday: ["10:00-16:00"],
        thursday: ["10:00-16:00"],
      },
      hourlyRate: 120,
    },
    {
      _id: "customer1",
      email: "customer1@example.com",
      firstName: "Pierre",
      lastName: "Durand",
      roles: ["CUSTOMER"],
      status: "ACTIVE",
    },
  ];

  return {
    MOCK_USERS: mockUsers,
  };
});

describe("GET /api/providers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and provider data for valid provider ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/provider1");
    const params = { id: "provider1" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUsers[0]);
  });

  it("should return 200 for another valid provider ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/provider2");
    const params = { id: "provider2" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUsers[1]);
  });

  it("should return 404 for non-existent provider ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/nonexistent");
    const params = { id: "nonexistent" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Prestataire non trouvé");
  });

  it("should return 404 for customer ID (non-provider)", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/customer1");
    const params = { id: "customer1" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Prestataire non trouvé");
  });

  it("should handle empty ID parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/");
    const params = { id: "" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Prestataire non trouvé");
  });

  it("should handle special characters in ID", async () => {
    const request = new NextRequest("http://localhost:3000/api/providers/special@#$%");
    const params = { id: "special@#$%" };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Prestataire non trouvé");
  });
});
