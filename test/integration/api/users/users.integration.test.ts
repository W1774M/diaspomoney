import { GET } from "@/app/api/users/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock des données utilisateurs
const mockUsers = [
  {
    _id: "user1",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    roles: ["ADMIN"],
    status: "ACTIVE",
  },
  {
    _id: "user2",
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
    _id: "user3",
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
    _id: "user4",
    email: "customer1@example.com",
    firstName: "Pierre",
    lastName: "Durand",
    roles: ["CUSTOMER"],
    status: "ACTIVE",
  },
  {
    _id: "user5",
    email: "customer2@example.com",
    firstName: "Sophie",
    lastName: "Leroy",
    roles: ["CUSTOMER"],
    status: "PENDING",
  },
];

// Mock des fonctions
vi.mock("@/mocks", () => {
  const mockUsers = [
    {
      _id: "user1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      roles: ["ADMIN"],
      status: "ACTIVE",
    },
    {
      _id: "user2",
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
      _id: "user3",
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
      _id: "user4",
      email: "customer1@example.com",
      firstName: "Pierre",
      lastName: "Durand",
      roles: ["CUSTOMER"],
      status: "ACTIVE",
    },
    {
      _id: "user5",
      email: "customer2@example.com",
      firstName: "Sophie",
      lastName: "Leroy",
      roles: ["CUSTOMER"],
      status: "PENDING",
    },
  ];

  return {
    MOCK_USERS: mockUsers,
    getUsersByRole: vi.fn((role: string) => {
      return mockUsers.filter(user => user.roles.includes(role));
    }),
  };
});

describe("GET /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and all users when no role filter", async () => {
    const request = new NextRequest("http://localhost:3000/api/users");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockUsers);
    expect(data.total).toBe(5);
  });

  it("should return 200 and filtered users for ADMIN role", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=ADMIN"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].roles).toContain("ADMIN");
    expect(data.total).toBe(1);
  });

  it("should return 200 and filtered users for PROVIDER role", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=PROVIDER"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].roles).toContain("PROVIDER");
    expect(data.data[1].roles).toContain("PROVIDER");
    expect(data.total).toBe(2);
  });

  it("should return 200 and filtered users for CUSTOMER role", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=CUSTOMER"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].roles).toContain("CUSTOMER");
    expect(data.data[1].roles).toContain("CUSTOMER");
    expect(data.total).toBe(2);
  });

  it("should return 200 and empty array for non-existent role", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=NONEXISTENT"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should handle case-insensitive role filter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=provider"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(0); // La route ne gère pas la casse insensible
    expect(data.total).toBe(0);
  });

  it("should handle multiple query parameters", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=PROVIDER&other=param"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it("should handle empty role parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/users?role=");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(5); // La route retourne tous les utilisateurs quand le rôle est vide
    expect(data.total).toBe(5);
  });

  it("should handle role parameter with mixed case and numbers", async () => {
    const mixedRole = "AdMiN123";
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${mixedRole}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should validate response structure consistency", async () => {
    const request = new NextRequest("http://localhost:3000/api/users");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.total).toBe("number");
    expect(data.total).toBe(data.data.length);
  });

  it("should handle malformed URL gracefully", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=ADMIN&invalid=param&"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].roles).toContain("ADMIN");
    expect(data.total).toBe(1);
  });

  it("should handle very long role parameter", async () => {
    const longRole = "A".repeat(1000);
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${longRole}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should handle special characters in role parameter", async () => {
    const specialRole = "ADMIN@#$%^&*()";
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${encodeURIComponent(specialRole)}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should handle role parameter with spaces", async () => {
    const roleWithSpaces = " ADMIN ";
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${encodeURIComponent(roleWithSpaces)}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should handle multiple role parameters (first one is used)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/users?role=ADMIN&role=PROVIDER"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].roles).toContain("ADMIN");
    expect(data.total).toBe(1);
  });

  it("should handle role parameter with unicode characters", async () => {
    const unicodeRole = "ADMINéèàç";
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${encodeURIComponent(unicodeRole)}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("should handle role parameter with numbers", async () => {
    const numericRole = "ADMIN123";
    const request = new NextRequest(
      `http://localhost:3000/api/users?role=${numericRole}`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });
});
