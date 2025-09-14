"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useNotificationStore } from "@/store/notifications";
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function VerifyEmailPage() {
  const { addNotification } = useNotificationStore();
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");

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
      // Simuler l'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000));

      addNotification({
        type: "success",
        message: "Email de vérification envoyé ! Vérifiez votre boîte mail.",
        duration: 6000,
      });

      setEmail("");
    } catch (error) {
      addNotification({
        type: "error",
        message: "Erreur lors de l'envoi. Veuillez réessayer.",
        duration: 4000,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Vérification de votre email
            </CardTitle>
            <CardDescription className="text-gray-600">
              Activez votre compte DiaspoMoney en vérifiant votre adresse email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Comment procéder :</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Vérifiez votre boîte mail (et les spams)</li>
                    <li>Cliquez sur le lien de vérification</li>
                    <li>Votre compte sera activé automatiquement</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Formulaire de renvoi */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Renvoyer l'email de vérification
              </h3>
              
              <form onSubmit={handleResendEmail} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isResending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Renvoyer l'email
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Aide et support */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Besoin d'aide ?</p>
                  <div className="space-y-2">
                    <a
                      href="/support"
                      className="block text-blue-600 hover:underline font-medium"
                    >
                      🆘 Contacter le support
                    </a>
                    <a
                      href="/hotline"
                      className="block text-blue-600 hover:underline font-medium"
                    >
                      📞 Appeler la hotline
                    </a>
                    <a
                      href="/login"
                      className="block text-blue-600 hover:underline font-medium"
                    >
                      🔙 Retour à la connexion
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
