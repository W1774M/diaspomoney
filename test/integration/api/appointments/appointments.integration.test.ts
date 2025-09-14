import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/appointments/route';

// Mock des modules au niveau supérieur
vi.mock('@/mocks', () => ({
  MOCK_APPOINTMENTS: [
    {
      id: "appointment1",
      providerId: "provider1",
      customerId: "customer1",
      serviceType: "immigration",
      appointmentDate: "2024-12-25T10:00:00.000Z",
      duration: 60,
      notes: "Consultation pour visa étudiant",
      status: "PENDING"
    },
    {
      id: "appointment2",
      providerId: "provider2",
      customerId: "customer2",
      serviceType: "education",
      appointmentDate: "2024-12-26T14:00:00.000Z",
      duration: 90,
      notes: "Conseil pour études au Canada",
      status: "CONFIRMED"
    }
  ]
}));

describe('GET /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all appointments successfully', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.appointments).toBeDefined();
    expect(Array.isArray(data.appointments)).toBe(true);
    expect(data.appointments).toHaveLength(2);
    expect(data.total).toBe(2);
  });
});

describe('POST /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        serviceType: 'immigration'
        // Missing providerId and customerId
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Données de rendez-vous incomplètes');
  });

  it('should return 201 for valid appointment creation', async () => {
    const appointmentData = {
      providerId: "provider1",
      customerId: "customer1",
      serviceType: "immigration",
      appointmentDate: "2024-12-27T10:00:00.000Z",
      duration: 60,
      notes: "Nouvelle consultation"
    };

    const request = new NextRequest('http://localhost:3000/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.appointment).toBeDefined();
    expect(data.appointment.providerId).toBe(appointmentData.providerId);
    expect(data.appointment.customerId).toBe(appointmentData.customerId);
    expect(data.appointment.serviceType).toBe(appointmentData.serviceType);
    expect(data.appointment.status).toBe('PENDING');
    expect(data.appointment.id).toBeDefined();
    expect(data.message).toBe('Rendez-vous créé avec succès');
  });
});
