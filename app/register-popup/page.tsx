"use client";

import { PopupRegisterForm } from "@/components/features/auth/PopupRegisterForm";
import { useState } from "react";

export default function RegisterPopupPage() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Test de la popup d'inscription
        </h1>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ouvrir popup d'inscription
        </button>

        {showPopup && (
          <PopupRegisterForm
            onClose={() => setShowPopup(false)}
            onSuccess={() => {
              console.log("Inscription réussie !");
              setShowPopup(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
