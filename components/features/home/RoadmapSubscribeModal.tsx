'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RoadmapSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoadmapSubscribeModal({
  isOpen,
  onClose,
}: RoadmapSubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser l'état quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/roadmap/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Une erreur est survenue');
      }

      setSuccess(true);
      // Fermer automatiquement après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l\'inscription',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#F97015]/10">
              <Mail className="w-5 h-5 text-[#F97015]" />
            </div>
            <h3
              id="subscribe-modal-title"
              className="text-lg font-semibold text-gray-900"
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Être notifié des nouveautés
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h4
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Inscription réussie !
              </h4>
              <p className="text-gray-600">
                Vous recevrez un email de confirmation sous peu.
              </p>
            </div>
          ) : (
            <>
              <p
                className="text-gray-600 mb-6"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Recevez les dernières actualités sur les nouvelles fonctionnalités
                de Diaspomoney directement dans votre boîte mail.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F97015] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full bg-[#F97015] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E85F0A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
