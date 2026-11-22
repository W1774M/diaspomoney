'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Mail, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';

interface RoadmapBecomeProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoadmapBecomeProviderModal({
  isOpen,
  onClose,
}: RoadmapBecomeProviderModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone(undefined);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/roadmap/become-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Une erreur est survenue');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        router.push('/dashboard/providers/apply');
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  const labelClass =
    'block text-sm font-medium text-gray-700 mb-2';
  const fontStyle = { fontFamily: 'var(--font-plus-jakarta-sans), sans-serif' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="become-provider-modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-brand-500/10">
              <User className="w-5 h-5 text-brand-700" />
            </div>
            <h3
              id="become-provider-modal-title"
              className="text-lg font-semibold text-gray-900"
              style={fontStyle}
            >
              Devenir Prestataire
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2" style={fontStyle}>
                Demande enregistrée !
              </h4>
              <p className="text-gray-600">
                Redirection vers la page de candidature...
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6" style={fontStyle}>
                Renseignez vos coordonnées pour être recontacté et accéder au formulaire de candidature.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="become-provider-name" className={labelClass} style={fontStyle}>
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="become-provider-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      disabled={isSubmitting}
                      className={`${inputClass} pl-10`}
                      style={fontStyle}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="become-provider-email" className={labelClass} style={fontStyle}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="become-provider-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      disabled={isSubmitting}
                      className={`${inputClass} pl-10`}
                      style={fontStyle}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="become-provider-phone" className={labelClass} style={fontStyle}>
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <PhoneInput
                      defaultCountry="fr"
                      value={phone || ''}
                      onChange={(phone) => setPhone(phone)}
                      className="w-full"
                      inputClassName={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim() || !phone || phone === ''}
                  className="w-full bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={fontStyle}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer et continuer'
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
