'use client';

import {
  FacebookLoginButton,
  GoogleLoginButton,
  LoginForm,
  OAuthProfileCompletion,
} from '@/components/features/auth';
import { useAppointment } from '@/components/features/providers';
import { useAuth } from '@/hooks/auth/useAuth';
import { useOAuthProfileCheck } from '@/hooks/auth/useOAuthProfileCheck';
import { CreditCard, Shield, TrendingUp, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function LoginPage() {
  const { data: appointmentData } = useAppointment();
  const { isAuthenticated, isLoading } = useAuth();
  const { needsProfileCompletion, userProfile, isChecking } =
    useOAuthProfileCheck();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Redirection simplifiée - si l'utilisateur est authentifié, rediriger immédiatement
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log(
        '[LOGIN] Utilisateur authentifié, redirection vers /dashboard'
      );

      // Redirection immédiate vers le dashboard
      if (appointmentData) {
        router.replace('/dashboard/appointments');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, appointmentData, router]);

  // Gérer les paramètres d'URL pour les erreurs d'authentification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const callbackUrl = urlParams.get('callbackUrl');

    if (error) {
      console.log("[LOGIN] Erreur d'authentification:", error);
      // L'erreur sera gérée par le composant LoginForm
    }

    if (callbackUrl) {
      console.log('[LOGIN] Callback URL:', callbackUrl);
      // Stocker l'URL de callback pour la redirection après connexion
      sessionStorage.setItem('authCallbackUrl', callbackUrl);
    }
  }, []);

  // Afficher un loader pendant la vérification
  if (isLoading || isChecking) {
    return (
      <div
        className='min-h-screen flex items-center justify-center'
        suppressHydrationWarning
      >
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  // Afficher la complétion du profil OAuth si nécessaire
  if (isAuthenticated && needsProfileCompletion && userProfile) {
    return <OAuthProfileCompletion user={userProfile} onComplete={() => {}} />;
  }

  // Rediriger si déjà connecté et profil complété (sécurité supplémentaire)
  if (isAuthenticated && !needsProfileCompletion) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50'>
      <div className='flex min-h-screen'>
        {/* Sidebar avec branding */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(25,100%,53%)] via-[hsl(25,100%,45%)] to-[hsl(25,100%,35%)] relative overflow-hidden'>
          {/* Pattern de fond */}
          <div className='absolute inset-0 bg-black/10'></div>
          <div className='absolute top-0 left-0 w-full h-full'>
            <div className='absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full'></div>
            <div className='absolute top-32 right-16 w-16 h-16 bg-white/10 rounded-full'></div>
            <div className='absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full'></div>
            <div className='absolute bottom-32 right-10 w-24 h-24 bg-white/10 rounded-full'></div>
          </div>

          <div className='relative z-10 flex flex-col justify-center px-12 py-12'>
            <div className='mb-8'>
              <Image
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                alt='DiaspoMoney'
                width={200}
                height={60}
                className='mb-6'
                priority
              />
              <h1 className='text-4xl font-bold text-white mb-4'>
                Bienvenue sur DiaspoMoney
              </h1>
              <p className='text-orange-100 text-lg leading-relaxed'>
                La plateforme de confiance pour vos services en Afrique.
                Connectez-vous pour accéder à des milliers de prestataires
                qualifiés.
              </p>
            </div>

            {/* Features */}
            <div className='space-y-6'>
              <div className='flex items-center space-x-4'>
                <div className='flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center'>
                  <Shield className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-white font-semibold'>
                    Paiements Sécurisés
                  </h3>
                  <p className='text-orange-100 text-sm'>
                    Transactions protégées par cryptage SSL
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center'>
                  <CreditCard className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-white font-semibold'>Services Premium</h3>
                  <p className='text-orange-100 text-sm'>
                    Accès à des prestataires vérifiés et recommandés
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center'>
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-white font-semibold'>
                    Croissance Continue
                  </h3>
                  <p className='text-orange-100 text-sm'>
                    Plus de 1000+ prestataires partenaires
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className='mt-12 grid grid-cols-3 gap-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white'>10K+</div>
                <div className='text-orange-100 text-sm'>Utilisateurs</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white'>1K+</div>
                <div className='text-orange-100 text-sm'>Prestataires</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white'>50K+</div>
                <div className='text-orange-100 text-sm'>Transactions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire de connexion */}
        <div className='flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8'>
          <div className='w-full max-w-md'>
            {/* Header mobile */}
            <div className='lg:hidden text-center mb-8'>
              <Image
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                alt='DiaspoMoney'
                width={180}
                height={54}
                className='mx-auto mb-4'
                priority
              />
            </div>

            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8'>
              <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] rounded-full mb-4'>
                  <User className='w-8 h-8 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  Connexion
                </h2>
                <p className='text-gray-600'>
                  Accédez à votre espace personnel
                </p>
              </div>

              {/* Formulaire de connexion */}
              <LoginForm />

              {/* Séparateur */}
              <div className='mt-8 mb-6'>
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-200' />
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-gray-500 font-medium'>
                      Ou continuer avec
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton Google */}
              <GoogleLoginButton />

              {/* Bouton Facebook */}
              <FacebookLoginButton />

              {/* Liens utiles */}
              <div className='mt-6 pt-6 border-t border-gray-100'>
                <div className='flex justify-center space-x-6 text-sm'>
                  <Link
                    href='/hotline'
                    className='text-gray-500 hover:text-gray-700 transition-colors duration-200'
                  >
                    Aide
                  </Link>
                  <Link
                    href='/support'
                    className='text-gray-500 hover:text-gray-700 transition-colors duration-200'
                  >
                    Support
                  </Link>
                  <Link
                    href='/privacy'
                    className='text-gray-500 hover:text-gray-700 transition-colors duration-200'
                  >
                    Confidentialité
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
