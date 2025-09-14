import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock des modules au niveau supérieur
vi.mock("@/mocks", () => ({
  MOCK_USERS: [
    {
      id: "user1",
      email: "customer@example.com",
      password: "CustomerPassword123!",
      firstName: "Bob",
      lastName: "Customer",
      roles: ["CUSTOMER"],
      status: "ACTIVE",
    },
    {
      id: "user2",
      email: "inactive@example.com",
      password: "InactivePassword123!",
      firstName: "Inactive",
      lastName: "User",
      roles: ["CUSTOMER"],
      status: "INACTIVE",
    },
    {
      id: "user3",
      email: "pending@example.com",
      password: "PendingPassword123!",
      firstName: "Pending",
      lastName: "User",
      roles: ["CUSTOMER"],
      status: "PENDING",
    },
    {
      id: "user4",
      email: "suspended@example.com",
      password: "SuspendedPassword123!",
      firstName: "Suspended",
      lastName: "User",
      roles: ["CUSTOMER"],
      status: "SUSPENDED",
    },
  ],
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for missing email or password", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email et mot de passe requis");
  });

  it("should return 401 for invalid credentials", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Email ou mot de passe incorrect");
  });

  it("should return 403 for inactive account", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "inactive@example.com",
        password: "InactivePassword123!",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Compte inactif");
    expect(data.status).toBe("INACTIVE");
  });

  it("should return 403 for pending account", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "pending@example.com",
        password: "PendingPassword123!",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("en cours de vérification");
    expect(data.status).toBe("PENDING");
  });

  it("should return 403 for suspended account", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "suspended@example.com",
        password: "SuspendedPassword123!",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("suspendu");
    expect(data.status).toBe("SUSPENDED");
  });

  it("should return 200 for valid credentials", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "customer@example.com",
        password: "CustomerPassword123!",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("customer@example.com");
    expect(data.user.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
  });
});
