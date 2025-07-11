"use client";
import DefaultTemplate from "@/template/DefaultTemplate";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token de vérification manquant");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Email vérifié avec succès !");
        } else {
          setStatus("error");
          setMessage(result.error || "Erreur lors de la vérification");
        }
      } catch {
        setStatus("error");
        setMessage("Erreur réseau ou serveur");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <DefaultTemplate>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl p-8">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/img/Logo_Diaspo_Horizontal_enrichi.webp"
                alt="DiaspoMoney"
                width={160}
                height={48}
                className="mb-4 drop-shadow-md"
                priority
              />

              {status === "loading" && (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h1 className="text-2xl font-extrabold text-blue-800 tracking-tight text-center">
                    Vérification en cours...
                  </h1>
                  <p className="text-blue-600 text-base text-center">
                    Veuillez patienter pendant que nous vérifions votre email.
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-blue-800 tracking-tight text-center">
                    Email vérifié !
                  </h1>
                  <p className="text-blue-600 text-base text-center mb-6">
                    Votre compte a été activé avec succès.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
                  >
                    Se connecter
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-red-800 tracking-tight text-center">
                    Erreur de vérification
                  </h1>
                  <p className="text-red-600 text-base text-center mb-6">
                    {message}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
                    >
                      Aller à la connexion
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200"
                    >
                      Créer un nouveau compte
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultTemplate>
  );
}
