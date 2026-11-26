"use client";

import { useNotificationStore } from "@/store/notifications";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

function VerifyEmailContent() {
  const { addNotification } = useNotificationStore();
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "loading" | "verified" | "expired" | "invalid" | "idle"
  >("idle");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Vérification du token à l'arrivée sur la page
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    // Appel à l'API pour vérifier le token
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setStatus("verified");
          setVerifiedEmail(data?.email || null);
        } else {
          const data = await res.json().catch(() => ({}));
          if (data?.reason === "expired") {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
        }
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [token]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      addNotification({
        type: "error",
        message: "Veuillez entrer votre adresse email",
        duration: 4000,
      });
      return;
    }

    setIsResending(true);

    try {
      // Appel réel à l'API pour renvoyer l'email de vérification
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Erreur lors de l'envoi.");
      }

      addNotification({
        type: "success",
        message: "Email de vérification envoyé ! Vérifiez votre boîte mail.",
        duration: 6000,
      });

      setEmail("");
    } catch (error: any) {
      addNotification({
        type: "error",
        message:
          error?.message ||
          "Erreur lors de l'envoi. Veuillez réessayer.",
        duration: 4000,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-600 to-amber-700 text-white p-8 text-center">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}></div>
            <div className="relative z-10">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Vérification de votre email</h1>
              <p className="text-sm opacity-90">
                {status === "loading"
                  ? "Vérification de votre lien en cours..."
                  : status === "verified"
                  ? "Votre compte DiaspoMoney a été vérifié avec succès !"
                  : status === "expired"
                  ? "Le lien de vérification a expiré. Veuillez demander un nouveau lien."
                  : status === "invalid"
                  ? "Lien de vérification invalide ou déjà utilisé."
                  : "Activez votre compte DiaspoMoney en vérifiant votre adresse email"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-10 space-y-6">
            {/* Affichage du token si présent */}
            {token && status === "loading" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Vérification du lien en cours...
              </div>
            )}

            {status === "verified" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold mb-1">
                    Félicitations, votre compte a été vérifié !
                  </div>
                  {verifiedEmail && (
                    <div className="text-xs text-green-700 mt-1">
                      Email vérifié : <span className="font-mono">{verifiedEmail}</span>
                    </div>
                  )}
                  <div className="text-xs text-green-700 mt-1">
                    Vous pouvez maintenant accéder à tous nos services.
                  </div>
                </div>
              </div>
            )}

            {status === "expired" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-semibold mb-1">
                    Le lien de vérification a expiré.
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Veuillez saisir votre adresse email pour recevoir un nouveau lien de vérification.
                  </div>
                </div>
              </div>
            )}

            {status === "invalid" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm mb-2 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold mb-1">
                    Lien de vérification invalide ou déjà utilisé.
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    Si besoin, vous pouvez demander un nouveau lien de vérification.
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {status === "verified" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-700 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-brand-800">
                    <p className="font-medium mb-1">Votre compte est maintenant actif !</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Vous pouvez vous connecter à votre espace DiaspoMoney</li>
                      <li>Profitez de tous nos services en toute sécurité</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {(status === "expired" || status === "invalid") && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Renvoyer l'email de vérification
                </h3>

                <form onSubmit={handleResendEmail} className="space-y-3">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Votre adresse email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-brand-600 bg-gray-50 transition-all duration-300"
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-amber-700 text-white font-bold shadow-lg hover:from-brand-700 hover:to-brand-800 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Renvoyer l'email
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Actions principales */}
            {status === "verified" && (
              <div className="space-y-4">
                <Link
                  href={"/dashboard"}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-white font-bold text-lg shadow-lg hover:from-brand-700 hover:to-brand-800 transition-all duration-200 transform hover:-translate-y-1"
                >
                  Accéder à mon compte
                </Link>
                
                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-brand-700 hover:text-brand-800 font-medium flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </div>
            )}

            {/* Aide et support */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Besoin d'aide ?</p>
                  <div className="space-y-2">
                    <Link
                      href="/support"
                      className="block text-brand-700 hover:underline font-medium"
                    >
                      🆘 Contacter le support
                    </Link>
                    <Link
                      href="/hotline"
                      className="block text-brand-700 hover:underline font-medium"
                    >
                      📞 Appeler la hotline
                    </Link>
                    <Link
                      href="/login"
                      className="block text-brand-700 hover:underline font-medium"
                    >
                      🔙 Retour à la connexion
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Chargement...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
