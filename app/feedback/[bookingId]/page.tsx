'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Star, Send, CheckCircle } from 'lucide-react';

/**
 * Page publique pour soumettre un feedback sur une prestation
 * Accessible sans authentification via un token sécurisé
 */
export default function FeedbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params?.bookingId as string;
  const token = searchParams?.get('token');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Feedback pour le service DiaspoMoney
  const [diaspomoneyRating, setDiaspomoneyRating] = useState<number>(0);
  const [diaspomoneyComment, setDiaspomoneyComment] = useState('');
  
  // Feedback pour le service/prestataire
  const [serviceRating, setServiceRating] = useState<number>(0);
  const [serviceComment, setServiceComment] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Charger les informations de la réservation
  useEffect(() => {
    if (!bookingId || !token) {
      setError('Lien invalide ou manquant');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/feedback-info?token=${encodeURIComponent(token)}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors du chargement des informations');
        }

        const data = await response.json();
        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des informations');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (diaspomoneyRating === 0 && serviceRating === 0) {
      setError('Veuillez attribuer au moins une note (service DiaspoMoney ou service/prestataire)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          // Feedback DiaspoMoney
          diaspomoneyRating: diaspomoneyRating > 0 ? diaspomoneyRating : undefined,
          diaspomoneyComment: diaspomoneyComment.trim() || undefined,
          // Feedback service/prestataire
          serviceRating: serviceRating > 0 ? serviceRating : undefined,
          serviceComment: serviceComment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la soumission du feedback');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission du feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-green-500 mb-4 flex justify-center">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre avis !</h1>
          <p className="text-gray-600 mb-4">
            Votre feedback a été enregistré avec succès. Nous apprécions votre retour et l'utiliserons pour améliorer nos services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,90%,48%)] px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Votre avis nous intéresse</h1>
            <p className="text-white/90">Partagez votre expérience avec nous</p>
          </div>

          {/* Booking Info */}
          {booking && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Détails de la prestation</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro de réservation :</span>
                  <span className="font-medium text-gray-900">{booking.reservationNumber || `RES-${bookingId.slice(-8).toUpperCase()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service :</span>
                  <span className="font-medium text-gray-900">{booking.serviceName || 'Service'}</span>
                </div>
                {booking.providerName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prestataire :</span>
                    <span className="font-medium text-gray-900">{booking.providerName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Feedback DiaspoMoney */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre avis sur DiaspoMoney</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comment avez-vous trouvé notre plateforme et notre service client ?
              </p>
              
              {/* Rating DiaspoMoney */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notez DiaspoMoney (0 à 5 étoiles) {diaspomoneyRating === 0 && '(optionnel)'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDiaspomoneyRating(star)}
                      className={`transition-transform hover:scale-110 ${
                        diaspomoneyRating >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${diaspomoneyRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  {diaspomoneyRating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">({diaspomoneyRating}/5)</span>
                  )}
                </div>
              </div>

              {/* Comment DiaspoMoney */}
              <div>
                <label htmlFor="diaspomoney-comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire sur DiaspoMoney (optionnel)
                </label>
                <textarea
                  id="diaspomoney-comment"
                  rows={4}
                  value={diaspomoneyComment}
                  onChange={(e) => setDiaspomoneyComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  placeholder="Partagez votre expérience avec la plateforme DiaspoMoney, le service client, la facilité d'utilisation..."
                />
              </div>
            </div>

            {/* Feedback Service/Prestataire */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre avis sur le service/prestataire</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comment avez-vous trouvé la prestation et le prestataire ?
              </p>
              
              {/* Rating Service */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notez le service/prestataire (0 à 5 étoiles) {serviceRating === 0 && '(optionnel)'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setServiceRating(star)}
                      className={`transition-transform hover:scale-110 ${
                        serviceRating >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${serviceRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  {serviceRating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">({serviceRating}/5)</span>
                  )}
                </div>
              </div>

              {/* Comment Service */}
              <div>
                <label htmlFor="service-comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire sur le service/prestataire (optionnel)
                </label>
                <textarea
                  id="service-comment"
                  rows={4}
                  value={serviceComment}
                  onChange={(e) => setServiceComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  placeholder="Partagez votre expérience avec le prestataire, la qualité du service, la ponctualité..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (diaspomoneyRating === 0 && serviceRating === 0)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer mon avis</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
