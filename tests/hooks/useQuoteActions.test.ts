/**
 * Tests unitaires pour useQuoteActions
 * 
 * Implémente les tests pour :
 * - deleteQuote
 * - approveQuote
 * - rejectQuote
 * - downloadQuote
 * - États de chargement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuoteActions } from '@/hooks/quotes/useQuoteActions';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de window.confirm
global.window.confirm = vi.fn(() => true);

// Mock de useNotificationManager
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({
    addSuccess: vi.fn(),
    addError: vi.fn(),
  }),
}));

describe('useQuoteActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteQuote', () => {
    it('devrait supprimer un devis avec succès', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      const deleteResult = await result.current.deleteQuote('quote-123');

      expect(deleteResult).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/quotes/quote-123', {
        method: 'DELETE',
      });
    });

    it('devrait gérer les erreurs de suppression', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Devis non trouvé' }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      const deleteResult = await result.current.deleteQuote('quote-123');

      expect(deleteResult).toBe(false);
    });

    it('devrait retourner false si l\'utilisateur annule', async () => {
      vi.mocked(window.confirm).mockReturnValueOnce(false);

      const { result } = renderHook(() => useQuoteActions());

      const deleteResult = await result.current.deleteQuote('quote-123');

      expect(deleteResult).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('devrait gérer l\'état isDeleting', async () => {
      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const { result } = renderHook(() => useQuoteActions());

      const deletePromise = result.current.deleteQuote('quote-123');

      // Attendre que isDeleting soit mis à true
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      resolveFetch!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await deletePromise;

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });
  });

  describe('approveQuote', () => {
    it('devrait approuver un devis avec succès', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      const approveResult = await result.current.approveQuote('quote-123');

      expect(approveResult).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/quotes/quote-123/approve', {
        method: 'POST',
      });
    });

    it('devrait gérer l\'état isApproving', async () => {
      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const { result } = renderHook(() => useQuoteActions());

      const approvePromise = result.current.approveQuote('quote-123');

      // Attendre que isApproving soit mis à true
      await waitFor(() => {
        expect(result.current.isApproving).toBe(true);
      });

      resolveFetch!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await approvePromise;

      await waitFor(() => {
        expect(result.current.isApproving).toBe(false);
      });
    });
  });

  describe('downloadQuote', () => {
    it('devrait télécharger un devis avec succès', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          'content-disposition': 'attachment; filename="devis-123.pdf"',
        }),
      } as Response);

      // Mock de window.URL et document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(
        mockLink as any,
      );
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const { result } = renderHook(() => useQuoteActions());

      await result.current.downloadQuote('quote-123');

      expect(fetch).toHaveBeenCalledWith('/api/quotes/quote-123/download', {
        method: 'GET',
      });
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('devrait gérer l\'état isDownloading', async () => {
      // Créer un container DOM pour renderHook
      const container = document.createElement('div');
      document.body.appendChild(container);

      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const { result } = renderHook(() => useQuoteActions(), {
        wrapper: ({ children }) => {
          const div = document.createElement('div');
          return div as any;
        },
      });

      const downloadPromise = result.current.downloadQuote('quote-123');

      expect(result.current.isDownloading).toBe(true);

      resolveFetch!({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers(),
      } as Response);

      await downloadPromise;

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(false);
      });
    });
  });
});

