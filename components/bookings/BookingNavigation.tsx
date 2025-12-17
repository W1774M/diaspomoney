'use client';

import { useBookings } from '@/hooks';
import { getRequesterName } from '@/lib/bookings/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect } from 'react';

interface BookingNavigationProps {
  currentBookingId: string;
}

/**
 * Composant de navigation entre les réservations
 * Permet de changer de réservation sans retourner à la liste
 */
export default function BookingNavigation({ currentBookingId }: BookingNavigationProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Récupérer toutes les réservations (sans pagination pour avoir la liste complète)
  const { bookings, loading } = useBookings({
    limit: 1000, // Limite élevée pour avoir toutes les réservations
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Trouver l'index de la réservation actuelle
  const currentIndex = useMemo(() => {
    return bookings.findIndex((b) => b._id === currentBookingId || b.id === currentBookingId);
  }, [bookings, currentBookingId]);

  // Filtrer les réservations selon le terme de recherche
  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;
    
    const term = searchTerm.toLowerCase();
    return bookings.filter((booking) => {
      const reservationNumber = booking.reservationNumber?.toLowerCase() || '';
      const requesterName = getRequesterName(booking).toLowerCase();
      return reservationNumber.includes(term) || requesterName.includes(term);
    });
  }, [bookings, searchTerm]);

  // Navigation précédent/suivant
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < bookings.length - 1 && currentIndex >= 0;

  const goToPrevious = useCallback(() => {
    if (!hasPrevious) return;
    const prevBooking = bookings[currentIndex - 1];
    if (!prevBooking) return;
    const bookingId = prevBooking._id || prevBooking.id;
    if (bookingId) {
      router.push(`/dashboard/bookings/${bookingId}`);
    }
  }, [hasPrevious, bookings, currentIndex, router]);

  const goToNext = useCallback(() => {
    if (!hasNext) return;
    const nextBooking = bookings[currentIndex + 1];
    if (!nextBooking) return;
    const bookingId = nextBooking._id || nextBooking.id;
    if (bookingId) {
      router.push(`/dashboard/bookings/${bookingId}`);
    }
  }, [hasNext, bookings, currentIndex, router]);

  const goToBooking = useCallback((bookingId: string) => {
    router.push(`/dashboard/bookings/${bookingId}`);
    setIsDropdownOpen(false);
    setSearchTerm('');
  }, [router]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.booking-navigation')) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Récupérer la réservation actuelle pour l'affichage
  const currentBooking = useMemo(() => {
    return bookings.find((b) => b._id === currentBookingId || b.id === currentBookingId);
  }, [bookings, currentBookingId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(25,100%,53%)]"></div>
        <span className="text-sm text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="booking-navigation flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      {/* Bouton Précédent */}
      <button
        onClick={goToPrevious}
        disabled={!hasPrevious}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Réservation précédente"
      >
        <ChevronLeft className="w-4 h-4 text-gray-700" />
      </button>

      {/* Sélecteur de réservation */}
      <div className="relative flex-1 min-w-0">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-gray-50 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {currentBooking?.reservationNumber || 'Sélectionner une réservation'}
            </div>
            {currentBooking && (
              <div className="text-xs text-gray-500 truncate">
                {getRequesterName(currentBooking)}
              </div>
            )}
          </div>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* Barre de recherche */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une réservation..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Liste des réservations */}
            <div className="overflow-y-auto max-h-80">
              {filteredBookings.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Aucune réservation trouvée
                </div>
              ) : (
                <div className="py-1">
                  {filteredBookings.map((booking) => {
                    const isActive = booking._id === currentBookingId || booking.id === currentBookingId;
                    return (
                      <button
                        key={booking._id || booking.id}
                        onClick={() => goToBooking(booking._id || booking.id)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          isActive ? 'bg-[hsl(25,100%,53%)]/10 border-l-2 border-[hsl(25,100%,53%)]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isActive ? 'text-[hsl(25,100%,53%)]' : 'text-gray-900'
                              }`}>
                                {booking.reservationNumber || 'Sans numéro'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {getRequesterName(booking)}
                              </div>
                              {booking.createdAt && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-[hsl(25,100%,53%)] flex-shrink-0"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compteur */}
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {filteredBookings.length} réservation{filteredBookings.length !== 1 ? 's' : ''}
              {searchTerm && ` trouvée${filteredBookings.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        )}
      </div>

      {/* Bouton Suivant */}
      <button
        onClick={goToNext}
        disabled={!hasNext}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Réservation suivante"
      >
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </button>

      {/* Indicateur de position */}
      {bookings.length > 0 && currentIndex >= 0 && (
        <div className="text-xs text-gray-500 px-2">
          {currentIndex + 1} / {bookings.length}
        </div>
      )}
    </div>
  );
}

