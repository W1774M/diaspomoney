'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface BookingsPaginationContextType {
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  getBookingsUrl: () => string;
}

const BookingsPaginationContext = createContext<BookingsPaginationContextType | undefined>(undefined);

const STORAGE_KEY_ITEMS_PER_PAGE = 'bookings_items_per_page';
const STORAGE_KEY_CURRENT_PAGE = 'bookings_current_page';

export function BookingsPaginationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Charger itemsPerPage depuis localStorage
  const getInitialItemsPerPage = (): number => {
    if (typeof window === 'undefined') return 20;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS_PER_PAGE);
      if (saved) {
        const parsed = parseInt(saved, 10);
        const validValues = [5, 10, 15, 20, 25, 30, 50, 100];
        if (!isNaN(parsed) && validValues.includes(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error reading itemsPerPage from localStorage');
    }
    return 20;
  };

  // Charger currentPage depuis les query params ou localStorage
  const getInitialPage = (): number => {
    const pageParam = searchParams.get('p');
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CURRENT_PAGE);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
    return 1;
  };

  const [currentPage, setCurrentPageState] = useState(getInitialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(getInitialItemsPerPage);

  // Synchroniser avec les query params (uniquement au chargement ou changement d'URL)
  useEffect(() => {
    // Ne synchroniser que si on est sur la page de liste
    if (pathname !== '/dashboard/bookings') {
      return;
    }
    
    const pageParam = searchParams.get('p');
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        // Ne mettre à jour que si la valeur est différente pour éviter les boucles
        setCurrentPageState(prev => {
          if (prev !== parsed) {
            return parsed;
          }
          return prev;
        });
      }
    } else {
      // Si pas de paramètre 'p' dans l'URL, réinitialiser à 1
      setCurrentPageState(prev => {
        if (prev !== 1) {
          return 1;
        }
        return prev;
      });
    }
  }, [searchParams, pathname]);

  // Sauvegarder itemsPerPage dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ITEMS_PER_PAGE, itemsPerPage.toString());
      } catch (error) {
        logger.error({ error }, 'Error saving itemsPerPage to localStorage');
      }
    }
  }, [itemsPerPage]);

  // Sauvegarder currentPage dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT_PAGE, currentPage.toString());
      } catch (error) {
        logger.error({ error }, 'Error saving currentPage to localStorage');
      }
    }
  }, [currentPage]);

  // Mettre à jour l'URL uniquement si on est sur la page de liste des bookings
  useEffect(() => {
    // Ne mettre à jour l'URL que si on est sur la page de liste
    if (pathname !== '/dashboard/bookings') {
      return;
    }

    const currentPageParam = searchParams.get('p');
    const newPage = currentPage.toString();
    
    // Ne mettre à jour l'URL que si elle est différente pour éviter les boucles
    if (currentPageParam !== newPage) {
      const params = new URLSearchParams(searchParams.toString());
      if (currentPage === 1) {
        params.delete('p');
      } else {
        params.set('p', newPage);
      }
      const newUrl = params.toString() ? `/dashboard/bookings?${params.toString()}` : '/dashboard/bookings';
      router.replace(newUrl);
    }
  }, [currentPage, router, pathname]);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
  }, []);

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPageState(1); // Réinitialiser à la page 1 quand on change itemsPerPage
  }, []);

  const getBookingsUrl = useCallback((): string => {
    const pageParam = searchParams.get('p');
    if (pageParam && pageParam !== '1') {
      return `/dashboard/bookings?p=${pageParam}`;
    }
    if (typeof window !== 'undefined') {
      try {
        const savedPage = localStorage.getItem(STORAGE_KEY_CURRENT_PAGE);
        if (savedPage && savedPage !== '1') {
          return `/dashboard/bookings?p=${savedPage}`;
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
    return '/dashboard/bookings';
  }, [searchParams]);

  return (
    <BookingsPaginationContext.Provider
      value={{
        currentPage,
        itemsPerPage,
        setCurrentPage,
        setItemsPerPage,
        getBookingsUrl,
      }}
    >
      {children}
    </BookingsPaginationContext.Provider>
  );
}

export function useBookingsPagination() {
  const context = useContext(BookingsPaginationContext);
  if (context === undefined) {
    throw new Error('useBookingsPagination must be used within a BookingsPaginationProvider');
  }
  return context;
}

