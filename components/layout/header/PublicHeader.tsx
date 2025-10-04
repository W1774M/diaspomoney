"use client";

import Logo from "@/components/ui/Logo";
import { useAuth } from "@/hooks/auth/useAuth";
import { Menu, Search, User } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";

export default function PublicHeader() {
  const { user, signOut, isAuthenticated: _isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    signOut();
  };

  // Forcer la mise à jour du composant quand l'état d'authentification change
  useEffect(() => {
    console.log("PublicHeader - Auth state changed:", {
      user,
      isAuthenticated: _isAuthenticated,
    });
    setForceUpdate(prev => prev + 1);
  }, [_isAuthenticated, user]);

  return (
    <header
      key={forceUpdate}
      className="bg-black shadow-sm border-b border-gray-800"
    >
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

          {/* Navigation centrale */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/providers"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Prestataires
            </Link>
            <Link
              href="#services"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Services
            </Link>
            <Link
              href="#how-it-works"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={e => {
                e.preventDefault();
                document.getElementById("how-it-works")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Comment ça marche
            </Link>
            <Link
              href="#about"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              À propos
            </Link>
            <Link
              href="/support"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Support
            </Link>
            <Link
              href="/hotline"
              className="text-white hover:text-[hsl(25,100%,53%)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Hotline
            </Link>
          </nav>

          {/* Actions côté droit */}
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <button className="p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {/* Menu utilisateur (si connecté) */}
            {user ? (
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
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)]"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Bouton "Se connecter" si non connecté */
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,45%)] transition-colors"
              >
                Se connecter
              </Link>
            )}

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
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/providers"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Prestataires
              </Link>
              <Link
                href="#services"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="#how-it-works"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={e => {
                  e.preventDefault();
                  setIsMenuOpen(false);
                  document.getElementById("how-it-works")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Comment ça marche
              </Link>
              <Link
                href="/support"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/hotline"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Hotline
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
