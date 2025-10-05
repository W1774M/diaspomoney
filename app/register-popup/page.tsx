"use client";

import { SimplifiedRegisterForm } from "@/components/features/auth/SimplifiedRegisterForm";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function RegisterPopupPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);

    // Fermer automatiquement après 3 secondes (plus rapide)
    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        window.close();
      }, 1000);
    }, 3000);
  };

  // Vérifier si on est dans une popup
  useEffect(() => {
    if (window.opener) {
      // On est dans une popup, on peut fermer automatiquement
    }
  }, []);

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription réussie !
            </h2>
            <p className="text-gray-600 mb-4">
              Un email de validation a été envoyé à votre adresse email.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Important :</strong> Consultez votre boîte email et
                cliquez sur le lien de validation pour activer votre compte et
                accéder à vos services.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Cette fenêtre se fermera automatiquement dans 3 secondes...
            </div>
            {isClosing && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <SimplifiedRegisterForm onSuccess={handleSuccess} />
    </div>
  );
}
