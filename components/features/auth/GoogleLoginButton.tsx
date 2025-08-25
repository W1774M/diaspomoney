"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface GoogleLoginButtonProps {
  className?: string;
}

export function GoogleLoginButton({ className = "" }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className} cursor-pointer`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3"></div>
      ) : (
        <svg
          className="w-5 h-5 mr-3"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12.0003 4.7455C13.9884 4.7455 15.6004 5.58055 16.7951 7.04535L21.2229 3.61855C19.1994 1.77355 16.0145 0.5 12.0003 0.5C6.4781 0.5 1.73246 3.8787 0.0957031 8.68055L4.65076 12.1723C5.76588 7.87535 8.93653 4.7455 12.0003 4.7455Z"
            fill="#EA4335"
          />
          <path
            d="M23.49 12.275C23.49 11.4917 23.4172 10.73 23.28 9.99167H12V14.525H18.47C18.21 16.0333 17.31 17.3417 15.93 18.225L20.37 21.625C22.66 19.4917 23.49 16.1667 23.49 12.275Z"
            fill="#4285F4"
          />
          <path
            d="M4.64973 11.83L3.90201 12.4087L0.0947266 8.68C1.73148 3.8782 6.47711 0.5 11.9993 0.5C16.0135 0.5 19.1984 1.77354 21.2219 3.61854L16.7941 7.04535C15.5994 5.58054 13.9874 4.7455 11.9993 4.7455C8.93555 4.7455 5.76548 7.87354 4.64973 11.83Z"
            fill="#FBBC05"
          />
          <path
            d="M12.0004 23.5C16.0004 23.5 19.3004 22.4583 21.6004 20.4583L17.1606 17.0583C16.0004 17.8583 14.3004 18.3333 12.0004 18.3333C8.9366 18.3333 6.17704 15.2083 5.06191 12L0.514648 15.4C2.64322 20.3333 7.50463 23.5 12.0004 23.5Z"
            fill="#34A853"
          />
        </svg>
      )}
      {isLoading ? "Connexion..." : "Continuer avec Google"}
    </button>
  );
}
