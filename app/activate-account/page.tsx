'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/** Appelle l'activation ; sans mot de passe, le serveur répond PASSWORD_REQUIRED s'il en faut un. */
async function activate(activationToken: string, newPassword?: string) {
  const res = await fetch('/api/auth/activate-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: activationToken, ...(newPassword && { password: newPassword }) }),
  });
  const result = await res.json().catch(() => ({}));
  return { ok: res.ok, code: result.code as string | undefined, error: result.error as string | undefined };
}

function ActivateAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Mot de passe déjà choisi à l'inscription : le lien suffit. Le formulaire n'apparaît
  // que si le compte n'en a pas encore (compte créé par l'admin).
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const callbackParam = searchParams.get('callbackUrl');
    if (!tokenParam || tokenParam.trim() === '') {
      setError('Token d\'activation manquant');
      setIsChecking(false);
      return;
    }
    setToken(tokenParam);
    if (callbackParam && callbackParam.trim() !== '') {
      setCallbackUrl(callbackParam);
    }

    let cancelled = false;
    activate(tokenParam)
      .then(({ ok, code, error: message }) => {
        if (cancelled) return;
        // Lien déjà utilisé : le compte est actif, l'utilisateur peut se connecter
        if (ok || code === 'ALREADY_ACTIVATED') setSuccess(true);
        else if (code === 'PASSWORD_REQUIRED') setNeedsPassword(true);
        else setError(message || 'Erreur lors de l\'activation du compte');
      })
      .catch(() => {
        if (!cancelled) setError('Erreur réseau ou serveur');
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Token d\'activation manquant');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await activate(token, password);

      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error || 'Erreur lors de l\'activation du compte');
      }
    } catch {
      setError('Erreur réseau ou serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Compte activé avec succès !
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Votre compte a été activé. Choisissez où continuer.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              {callbackUrl && (
                <Button
                  variant="outline"
                  className="sm:w-auto w-full border-brand-600 text-brand-700 hover:bg-brand-500/5"
                  onClick={() => {
                    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                  }}
                >
                  Revenir à ma dernière transaction
                </Button>
              )}
              <Button
                className="bg-brand-600 hover:bg-brand-700 sm:w-auto w-full"
                onClick={() => {
                  router.push('/login?callbackUrl=/dashboard');
                }}
              >
                Accéder à mon Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Image
                src="/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp"
                alt="DiaspoMoney"
                width={160}
                height={48}
                className="drop-shadow-md"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Activer votre compte
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {needsPassword
                ? 'Définissez votre mot de passe pour activer votre compte'
                : isChecking
                  ? 'Activation de votre compte en cours…'
                  : ''}
            </p>
          </CardHeader>
          <CardContent>
            {!needsPassword && error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {needsPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor='activate-account-password' className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input id='activate-account-password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-brand-600 bg-gray-50 transition-all"
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor='activate-account-confirm-password' className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input id='activate-account-confirm-password'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-brand-600 bg-gray-50 transition-all"
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse" />
                    Activation en cours...
                  </span>
                ) : (
                  'Activer mon compte'
                )}
              </Button>
            </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Déjà un compte ? Se connecter
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-orange-600 animate-pulse" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Chargement...
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}

