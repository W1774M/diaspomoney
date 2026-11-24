/**
 * GET/POST /api/commands/undo
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type HistoryCmd = {
  getName: () => string;
  getData: () => unknown;
  canUndo: () => boolean;
};

const { undo, getHistory, getHistorySize } = vi.hoisted(() => ({
  undo: vi.fn(),
  getHistory: vi.fn((): HistoryCmd[] => []),
  getHistorySize: vi.fn(() => 0),
}));

vi.mock('@/lib/di/initialize', () => ({ initializeDI: vi.fn() }));
vi.mock('@/commands', () => ({
  commandHandler: { undo, getHistory, getHistorySize },
}));

import { GET, POST } from '@/app/api/commands/undo/route';

describe('/api/commands/undo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('répond 400 si undo échoue', async () => {
      undo.mockResolvedValue({ success: false, error: 'Rien à annuler' });
      const res = await POST(new NextRequest('http://localhost/api/commands/undo', { method: 'POST' }));
      expect(res.status).toBe(400);
      expect((await res.json()).success).toBe(false);
    });

    it('annule la dernière commande', async () => {
      undo.mockResolvedValue({ success: true, commandName: 'UpdateUser' });
      const res = await POST(new NextRequest('http://localhost/api/commands/undo', { method: 'POST' }));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.commandName).toBe('UpdateUser');
    });
  });

  describe('GET', () => {
    it('retourne l’historique des commandes', async () => {
      getHistorySize.mockReturnValue(1);
      getHistory.mockReturnValue([
        {
          getName: () => 'UpdateUser',
          getData: () => ({ id: 'u1' }),
          canUndo: () => true,
        },
      ]);
      const res = await GET(new NextRequest('http://localhost/api/commands/undo'));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.historySize).toBe(1);
      expect(body.commands[0]).toEqual({
        name: 'UpdateUser',
        data: { id: 'u1' },
        canUndo: true,
      });
    });
  });
});
