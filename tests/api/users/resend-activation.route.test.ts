// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserProfile: vi.fn(),
  sendAccountActivationEmail: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: h.auth }));
vi.mock('@/services/user/user.service', () => ({
  userService: { getUserProfile: h.getUserProfile },
}));
vi.mock('@/lib/email/resend', () => ({
  sendAccountActivationEmail: h.sendAccountActivationEmail,
}));

import { POST } from '@/app/api/users/[id]/resend-activation/route';

const call = (id: string) =>
  POST(
    new NextRequest(`http://localhost:3000/api/users/${id}/resend-activation`, { method: 'POST' }),
    { params: Promise.resolve({ id }) } as any,
  );

beforeEach(() => {
  vi.clearAllMocks();
  process.env['JWT_SECRET'] = 'test-secret';
  h.auth.mockResolvedValue({ user: { id: 'admin1' } });
});

describe('POST /api/users/[id]/resend-activation', () => {
  it('refuse d’activer un compte proposé par un CSM sans e-mail réel', async () => {
    h.getUserProfile.mockImplementation(async (id: string) =>
      id === 'admin1'
        ? { id, roles: ['ADMIN'] }
        : { id, status: 'PENDING', email: 'prestataire-abc@a-completer.invalid', name: 'Sow' },
    );

    const res = await call('prov1');
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('e-mail');
    expect(h.sendAccountActivationEmail).not.toHaveBeenCalled();
  });

  it('envoie le lien une fois l’e-mail réel renseigné', async () => {
    h.getUserProfile.mockImplementation(async (id: string) =>
      id === 'admin1'
        ? { id, roles: ['ADMIN'] }
        : { id, status: 'PENDING', email: 'sow@exemple.sn', name: 'Sow' },
    );

    const res = await call('prov1');

    expect(res.status).toBe(200);
    expect(h.sendAccountActivationEmail).toHaveBeenCalledWith(
      'sow@exemple.sn',
      'Sow',
      expect.stringContaining('/activate-account?token='),
    );
  });
});
