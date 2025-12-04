'use client';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SimplifiedRegisterForm } from './SimplifiedRegisterForm';
import Link from 'next/link';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    countryOfResidence: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    marketingConsent: false,
  });

  // Vérifier si c'est un flux d'inscription simplifiée post-paiement
  const [isSimplifiedRegistration] = useState(false);

  // Gérer l'hydratation et les searchParams de manière sûre
  useEffect(() => {
    setIsMounted(true);
    
    // Récupérer les paramètres OAuth après le montage pour éviter les problèmes d'hydratation
    if (searchParams) {
      const oauthEmail = searchParams.get('email') || '';
      const oauthName = searchParams.get('name') || '';
      
      if (oauthEmail) {
        setFormData(prev => ({ ...prev, email: oauthEmail }));
      }
      if (oauthName) {
        const nameParts = oauthName.split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        }));
      }
    }
  }, [searchParams]);

  // Récupérer les valeurs OAuth de manière sûre
  const oauthProvider = isMounted ? (searchParams?.get('oauth') || '') : '';
  const oauthProviderAccountId = isMounted ? (searchParams?.get('providerAccountId') || '') : '';

  // Si c'est une inscription simplifiée, utiliser le composant simplifié
  if (isSimplifiedRegistration) {
    return (
      <SimplifiedRegisterForm
        onSuccess={() => router.push('/dashboard')}
      />
    );
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Validation pour une seule étape - champs essentiels uniquement
    const basicFields = 
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.termsAccepted;

    if (oauthProvider) {
      return basicFields;
    }

    return (
      basicFields &&
      formData.password.trim() !== '' &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        selectedServices: undefined,
        oauth: oauthProvider
          ? {
              provider: oauthProvider,
              providerAccountId: oauthProviderAccountId,
            }
          : undefined,
        // Si OAuth, on n'envoie pas le mot de passe
        ...(oauthProvider
          ? { password: undefined, confirmPassword: undefined }
          : {}),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsSuccess(true);
        // Rediriger automatiquement après 2 secondes
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    } catch {
      setError('Erreur réseau ou serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className='text-center py-8'>
        <div className='text-5xl mb-4'>🎉</div>
        <h3 className='text-xl font-bold text-green-600 mb-2'>
          Compte créé avec succès !
        </h3>
        <p className='text-gray-600 text-sm mb-4'>
          Bienvenue dans la famille DiaspoMoney !
        </p>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
          <p className='text-xs text-blue-800'>
            Un email de confirmation a été envoyé à votre adresse.
          </p>
        </div>
        <p className='text-xs text-gray-500'>
          Redirection en cours...
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6' suppressHydrationWarning>
      {/* Champs essentiels - toujours visibles */}
      <div className='space-y-5'>
        {/* Nom et Prénom sur une ligne */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Prénom <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.firstName}
              onChange={e =>
                handleInputChange('firstName', e.target.value)
              }
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
              placeholder='Jean'
              required
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Nom <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.lastName}
              onChange={e =>
                handleInputChange('lastName', e.target.value)
              }
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
              placeholder='Dupont'
              required
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className='block mb-2 text-sm font-medium text-gray-700'>
            Email <span className='text-red-500'>*</span>
          </label>
          <input
            type='email'
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
            placeholder='jean.dupont@exemple.com'
            required
            suppressHydrationWarning
          />
        </div>

        {/* Mot de passe (si pas OAuth) */}
        {!oauthProvider && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                Mot de passe <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e =>
                    handleInputChange('password', e.target.value)
                  }
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
                  placeholder='••••••••'
                  required
                  minLength={8}
                  suppressHydrationWarning
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-1.5'>
                Minimum 8 caractères
              </p>
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                Confirmer <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange(
                      'confirmPassword',
                      e.target.value,
                    )
                  }
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
                  placeholder='••••••••'
                  required
                  suppressHydrationWarning
                />
                <button
                  type='button'
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Champs optionnels - Progressive Disclosure */}
      {showOptionalFields && (
        <div className='space-y-5 pt-4 border-t border-gray-200'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                Téléphone
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={e =>
                  handleInputChange('phone', e.target.value)
                }
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
                placeholder='+33 6 12 34 56 78'
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-700'>
                Date de naissance
              </label>
              <input
                type='date'
                value={formData.dateOfBirth}
                onChange={e =>
                  handleInputChange('dateOfBirth', e.target.value)
                }
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-[hsl(25,100%,53%)] transition-all duration-200 text-base'
                aria-label='Date de naissance'
                title='Date de naissance'
              />
            </div>
          </div>
        </div>
      )}

      {/* Bouton pour afficher/masquer les champs optionnels */}
      {!showOptionalFields && (
        <button
          type='button'
          onClick={() => setShowOptionalFields(true)}
          className='text-sm text-[hsl(25,100%,53%)] hover:underline font-medium'
        >
          + Ajouter des informations optionnelles
        </button>
      )}

      {/* Conditions */}
      <div className='space-y-3 pt-2'>
        <label className='flex items-start space-x-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={formData.termsAccepted}
            onChange={e =>
              handleInputChange('termsAccepted', e.target.checked)
            }
            className='mt-0.5 w-4 h-4 text-[hsl(25,100%,53%)] rounded focus:ring-[hsl(25,100%,53%)]'
            required
            aria-label="Accepter les conditions générales d'utilisation"
          />
          <span className='text-sm text-gray-600 leading-relaxed'>
            J'accepte les{' '}
            <Link
              href='/terms'
              className='text-[hsl(25,100%,53%)] hover:underline font-medium'
            >
              conditions générales
            </Link>{' '}
            et la{' '}
            <Link
              href='/privacy'
              className='text-[hsl(25,100%,53%)] hover:underline font-medium'
            >
              politique de confidentialité
            </Link>{' '}
            <span className='text-red-500'>*</span>
          </span>
        </label>

        <label className='flex items-start space-x-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={formData.marketingConsent}
            onChange={e =>
              handleInputChange(
                'marketingConsent',
                e.target.checked,
              )
            }
            className='mt-0.5 w-4 h-4 text-[hsl(25,100%,53%)] rounded focus:ring-[hsl(25,100%,53%)]'
            aria-label="Recevoir des informations marketing"
          />
          <span className='text-sm text-gray-600 leading-relaxed'>
            Je souhaite recevoir des informations sur les nouveaux
            services et promotions
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-sm text-red-600 font-medium'>{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !validateForm()}
        className='w-full py-3.5 rounded-lg bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base'
      >
        {isLoading ? 'Création en cours...' : 'Créer mon compte'}
      </button>

      {/* Footer */}
      <div className='text-center pt-4'>
        <p className='text-sm text-gray-600'>
          Déjà un compte ?{' '}
          <Link
            href='/login'
            className='font-semibold text-[hsl(25,100%,53%)] hover:underline transition-colors duration-200'
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
