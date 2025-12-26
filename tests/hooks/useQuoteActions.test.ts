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
import { renderHook, waitFor, act } from '@testing-library/react';
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

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteQuote('quote-123');
      });

      expect(deleteResult!).toBe(true);
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

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteQuote('quote-123');
      });

      expect(deleteResult!).toBe(false);
    });

    it('devrait retourner false si l\'utilisateur annule', async () => {
      vi.mocked(window.confirm).mockReturnValueOnce(false);

      const { result } = renderHook(() => useQuoteActions());

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteQuote('quote-123');
      });

      expect(deleteResult!).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('devrait gérer l\'état isDeleting', async () => {
      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const { result } = renderHook(() => useQuoteActions());

      let deletePromise: Promise<boolean>;
      await act(async () => {
        deletePromise = result.current.deleteQuote('quote-123');
      });

      // Attendre que isDeleting soit mis à true
      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      await act(async () => {
        resolveFetch!({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      });

      await act(async () => {
        await deletePromise!;
      });

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

      let approveResult: boolean;
      await act(async () => {
        approveResult = await result.current.approveQuote('quote-123');
      });

      expect(approveResult!).toBe(true);
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

      let approvePromise: Promise<boolean>;
      await act(async () => {
        approvePromise = result.current.approveQuote('quote-123');
      });

      // Attendre que isApproving soit mis à true
      await waitFor(() => {
        expect(result.current.isApproving).toBe(true);
      });

      await act(async () => {
        resolveFetch!({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      });

      await act(async () => {
        await approvePromise!;
      });

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

      // Mock de window.URL et document.createElement pour les liens uniquement
      // IMPORTANT: on retourne un VRAI <a> pour ne pas casser le rendu React (createRoot)
      let lastLink: HTMLAnchorElement | null = null;
      const originalCreateElement = HTMLDocument.prototype.createElement;
      vi.spyOn(document, 'createElement').mockImplementation((tagName: any, options: any) => {
        const el = originalCreateElement.call(document, tagName, options) as any;
        if (tagName === 'a') {
          lastLink = el as HTMLAnchorElement;
          vi.spyOn(lastLink, 'click').mockImplementation(() => {});
        }
        return el;
      });
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const { result } = renderHook(() => useQuoteActions());

      await act(async () => {
        await result.current.downloadQuote('quote-123');
      });

      expect(fetch).toHaveBeenCalledWith('/api/quotes/quote-123/download', {
        method: 'GET',
      });
      expect(lastLink).toBeTruthy();
      expect(vi.mocked(lastLink!.click)).toHaveBeenCalled();
    });

    it('devrait gérer l\'état isDownloading', async () => {
      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      // Mock de window.URL et document.createElement pour les liens uniquement
      const originalCreateElement = HTMLDocument.prototype.createElement;
      vi.spyOn(document, 'createElement').mockImplementation((tagName: any, options: any) => {
        const el = originalCreateElement.call(document, tagName, options) as any;
        if (tagName === 'a') {
          vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {});
        }
        return el;
      });
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const { result } = renderHook(() => useQuoteActions());

      let downloadPromise: Promise<void>;
      await act(async () => {
        downloadPromise = result.current.downloadQuote('quote-123');
      });

      expect(result.current.isDownloading).toBe(true);

      await act(async () => {
        resolveFetch!({
          ok: true,
          blob: async () => mockBlob,
          headers: new Headers(),
        } as Response);
      });

      await act(async () => {
        await downloadPromise!;
      });

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(false);
      });
    });
  });

  describe('rejectQuote', () => {
    it('devrait rejeter un devis avec succès', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      let rejectResult: boolean;
      await act(async () => {
        rejectResult = await result.current.rejectQuote('quote-123');
      });

      expect(rejectResult!).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/quotes/quote-123/reject', {
        method: 'POST',
      });
    });

    it('devrait gérer les erreurs de rejet', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Devis non trouvé' }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      let rejectResult: boolean;
      await act(async () => {
        rejectResult = await result.current.rejectQuote('quote-123');
      });

      expect(rejectResult!).toBe(false);
    });

    it('devrait retourner false si l\'utilisateur annule', async () => {
      vi.mocked(window.confirm).mockReturnValueOnce(false);

      const { result } = renderHook(() => useQuoteActions());

      let rejectResult: boolean;
      await act(async () => {
        rejectResult = await result.current.rejectQuote('quote-123');
      });

      expect(rejectResult!).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('devrait gérer l\'état isRejecting', async () => {
      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const { result } = renderHook(() => useQuoteActions());

      let rejectPromise: Promise<boolean>;
      await act(async () => {
        rejectPromise = result.current.rejectQuote('quote-123');
      });

      await waitFor(() => {
        expect(result.current.isRejecting).toBe(true);
      });

      await act(async () => {
        resolveFetch!({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      });

      await act(async () => {
        await rejectPromise!;
      });

      await waitFor(() => {
        expect(result.current.isRejecting).toBe(false);
      });
    });
  });

  describe('downloadQuote - gestion d\'erreurs', () => {
    it('devrait gérer l\'erreur 404 lors du téléchargement', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      await act(async () => {
        await result.current.downloadQuote('quote-123');
      });

      expect(result.current.isDownloading).toBe(false);
    });

    it('devrait gérer l\'erreur 403 lors du téléchargement', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      await act(async () => {
        await result.current.downloadQuote('quote-123');
      });

      expect(result.current.isDownloading).toBe(false);
    });

    it('devrait gérer les autres erreurs lors du téléchargement', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Erreur serveur' }),
      } as Response);

      const { result } = renderHook(() => useQuoteActions());

      await act(async () => {
        await result.current.downloadQuote('quote-123');
      });

      expect(result.current.isDownloading).toBe(false);
    });

    it('devrait gérer les erreurs de réseau lors du téléchargement', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useQuoteActions());

      await act(async () => {
        await result.current.downloadQuote('quote-123');
      });

      expect(result.current.isDownloading).toBe(false);
    });
  });
});

