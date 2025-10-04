"use client";

import Logo from "@/components/ui/Logo";
import { useAuth } from "@/hooks/auth/useAuth";
import { Menu, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function Header() {
  const { user, signOut, isSigningOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-black shadow-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Logo
                src="/img/logos/Logo_DispoMoney_horiz_CMJN_web.png"
                width={200}
                height={100}
                alt="Diaspomoney"
              />
            </Link>
          </div>

          {/* Actions côté droit */}
          <div className="flex items-center space-x-4">
            {/* Bouton "Transférer un service" - toujours visible */}
            <Link
              href="/services"
              onClick={() => {
                // Reset les filtres en naviguant vers /services sans paramètres
                window.history.replaceState({}, "", "/services");
              }}
              className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,45%)] transition-colors"
            >
              Transférer un service
            </Link>

            {/* Menu utilisateur - visible seulement si connecté */}
            {isClient && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-white">
                    {user?.name || "Utilisateur"}
                  </span>
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)]"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)]"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSigningOut ? "Déconnexion..." : "Déconnexion"}
                    </button>
                  </div>
                )}
              </div>
            ) : isClient ? (
              /* Bouton "Se connecter" - visible seulement si non connecté */
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-transparent text-sm font-medium text-white hover:text-[hsl(25,100%,53%)]"
              >
                <User className="h-4 w-4 mr-2 text-[hsl(25,100%,53%)]" />
                Se connecter
              </Link>
            ) : null}

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              {isClient && user ? (
                /* Menu mobile pour utilisateur connecté */
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/appointments"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Rendez-vous
                  </Link>
                  <Link
                    href="/dashboard/invoices"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Factures
                  </Link>
                  <Link
                    href="/services"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Reset les filtres en naviguant vers /services sans paramètres
                      window.history.replaceState({}, "", "/services");
                    }}
                  >
                    Transférer un service
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    disabled={isSigningOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSigningOut ? "Déconnexion..." : "Déconnexion"}
                  </button>
                </>
              ) : isClient ? (
                /* Menu mobile pour utilisateur non connecté */
                <>
                  <Link
                    href="/services"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Reset les filtres en naviguant vers /services sans paramètres
                      window.history.replaceState({}, "", "/services");
                    }}
                  >
                    Transférer un service
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
