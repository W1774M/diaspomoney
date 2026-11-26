'use client';

import {
  Button,
  Form,
  Input,
} from '@/components/ui';
import { useNotificationManager } from '@/components/ui/Notification';
import { useLogin } from '@/hooks';
import { useForm } from '@/hooks/forms/useForm';
import { loginSchema } from '@/lib/validations';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler } from 'react-hook-form';
import z from 'zod';

// Custom hook for URL status handling
const useUrlStatus = () => {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStatus = urlParams.get('status');
    setStatus(urlStatus);
  }, []);

  return status;
};

// Custom hook for URL error handling
const useUrlError = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    setError(urlError);
  }, []);

  return error;
};

export function LoginForm() {
  // const router = useRouter();
  const { login, isLoading: isLoggingIn } = useLogin();
  const { addInfo, addError } = useNotificationManager();
  const urlStatus = useUrlStatus();
  const urlError = useUrlError();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (urlStatus) {
      if (urlStatus === 'pending') {
        addInfo(
          'Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt.',
        );
      } else if (urlStatus === 'suspended') {
        addError(
          "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations.",
        );
      }
    }
  }, [urlStatus, addInfo, addError]);

  // Gérer les erreurs d'authentification depuis l'URL
  useEffect(() => {
    if (urlError) {
      // Récupérer le détail de l'erreur depuis l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const errorDetail = urlParams.get('detail');
      
      if (urlError === 'CredentialsSignin') {
        addError(
          'Identifiants incorrects. Vérifiez votre email et mot de passe.',
        );
      } else if (urlError === 'Callback') {
        addError('Erreur lors de la connexion. Veuillez réessayer.');
      } else if (urlError === 'Configuration') {
        addError('Erreur de configuration. Veuillez contacter le support.');
      } else if (urlError === 'DatabaseError') {
        const message = errorDetail 
          ? `Erreur de base de données: ${decodeURIComponent(errorDetail)}`
          : 'Erreur de connexion à la base de données. Veuillez réessayer.';
        addError(message);
        console.error('[LoginForm] Database error detail:', errorDetail);
      } else {
        addError("Erreur d'authentification. Veuillez réessayer.");
      }
    }
  }, [urlError, addError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // NextAuth gère désormais la session via cookies; aucun contrôle localStorage nécessaire

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    await login(data);
  };

  return (
    <div className='w-full'>
          <Form
            noValidate
            aria-labelledby='login-title'
            onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}
          >
            <Input
              id='email'
              type='email'
              label='Adresse e-mail'
              autoComplete='username'
              inputMode='email'
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              enterKeyHint='next'
              required
              error={errors['email']?.message as string | undefined}
              {...register('email')}
            />
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-baseline justify-between gap-4'>
                <label htmlFor='password' className='text-sm font-medium text-foreground'>
                  Mot de passe
                  <span aria-hidden='true' className='ms-0.5 text-destructive'>*</span>
                </label>
                <Link
                  href='/forgot-password'
                  className='text-sm font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline'
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  enterKeyHint='go'
                  required
                  className='pe-12'
                  aria-describedby={errors['password']?.message ? 'password-error' : undefined}
                  aria-invalid={errors['password']?.message ? true : undefined}
                  {...register('password')}
                />
                <button
                  type='button'
                  aria-pressed={showPassword}
                  aria-label='Afficher le mot de passe'
                  onClick={() => setShowPassword(v => !v)}
                  className='absolute end-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                >
                  {showPassword ? <EyeOff className='size-5' /> : <Eye className='size-5' />}
                </button>
              </div>
              {errors['password']?.message && (
                <p id='password-error' className='text-sm font-medium text-destructive'>
                  {errors['password']?.message as string}
                </p>
              )}
            </div>

            <Button type='submit' size='lg' className='mt-2 w-full' loading={isLoggingIn} loadingText='Connexion en cours…'>
              Se connecter
            </Button>

            {/* Test buttons for different account statuses */}
            {process.env['NODE_ENV'] === 'test' && (
              <div className='mt-4 space-y-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    // Fill form fields with test data
                    const emailInput = document.getElementById(
                      'email',
                    ) as HTMLInputElement;
                    const passwordInput = document.getElementById(
                      'password',
                    ) as HTMLInputElement;
                    if (emailInput && passwordInput) {
                      emailInput.value = 'customer@diaspomoney.com';
                      passwordInput.value = 'password123';
                      // Trigger change events
                      emailInput.dispatchEvent(
                        new Event('change', { bubbles: true }),
                      );
                      passwordInput.dispatchEvent(
                        new Event('change', { bubbles: true }),
                      );
                    }
                    // Simulate successful login for testing
                    // dispatch(
                    //   authActions.loginSuccess({
                    //     _id: "test-user",
                    //     email: "customer@diaspomoney.com",
                    //     name: "Test User",
                    //     roles: ["USER"],
                    //     status: "ACTIVE",
                    //   })
                    // );
                  }}
                  className='w-full'
                >
                  Compte Actif
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    // dispatch(authActions.loginFailure("COMPTE_INACTIF"));
                    // addWarning(
                    //   "Votre compte n'est pas encore activé. Veuillez vérifier votre boîte mail et cliquer sur le lien de vérification envoyé par DiaspoMoney."
                    // );
                  }}
                  className='w-full'
                >
                  Compte Inactif
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    // dispatch(authActions.loginFailure("COMPTE_EN_ATTENTE"));
                    // addInfo(
                    //   "Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt."
                    // );
                  }}
                  className='w-full'
                >
                  En Attente
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    // dispatch(authActions.loginFailure("COMPTE_SUSPENDU"));
                    // addError(
                    //   "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations."
                    // );
                  }}
                  className='w-full'
                >
                  Suspendu
                </Button>
              </div>
            )}
          </Form>
          <p className='mt-6 text-center text-sm text-muted-foreground'>
            Pas encore de compte ?{' '}
            <Link
              href='/register'
              className='font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline'
            >
              Créer un compte
            </Link>
          </p>
    </div>
  );
}
