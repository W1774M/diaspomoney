"use client";
import { Calendar, ChevronDown, Home, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Header = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: afficher l'état de la session dans le header
  console.log("Header - Status:", status);
  console.log("Header - Session:", session);

  function handleRedirect(path: string) {
    router.push(path);
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  // Gestion du hover avec délai
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300); // Délai de 300ms avant de fermer
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Nettoyer le timeout quand le composant se démonte
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="bg-black text-white shadow-sm sticky top-0 z-20 w-full">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => handleRedirect("/")}
          >
            <Image
              src="/img/logos/Logo_DispoMoney_horiz_CMJN_web.png"
              width={200}
              height={100}
              alt="Diaspomoney"
              loading="lazy"
              priority={false}
            />
          </h1>
          <span className="text-sm ml-2 hidden md:inline">
            Je transfère un service, et non l&apos;argent !
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            className="bg-[hsl(23,100%,53%)] text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition flex items-center cursor-pointer"
            // onClick={() => handleRedirect("/provider")}
            type="button"
          >
            Transférer un service
          </button>

          {/* Menu utilisateur conditionnel */}
          {status === "loading" ? (
            <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
          ) : session ? (
            // Utilisateur connecté - Menu dropdown avec hover amélioré
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center space-x-2 text-white hover:text-[hsl(23,100%,53%)] transition-colors duration-200 cursor-pointer">
                <div className="w-8 h-8 bg-[hsl(23,100%,53%)] rounded-full flex items-center justify-center">
                  <User size={16} className="text-black" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {session.user?.name?.split(" ")[0] ||
                    session.user?.email?.split("@")[0] ||
                    "Mon compte"}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {/* En-tête avec infos utilisateur */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <p className="text-sm font-semibold text-gray-900">
                      {session.user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.user?.email}
                    </p>
                  </div>

                  {/* Options du menu */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Home size={16} className="mr-3 text-blue-600" />
                      Mon compte
                    </Link>

                    <Link
                      href="/dashboard/appointments"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Calendar size={16} className="mr-3 text-green-600" />
                      Mes rendez-vous
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <LogOut size={16} className="mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Utilisateur non connecté - Logo cliquable vers login
            <div
              className="flex items-center space-x-2 text-white hover:text-[hsl(23,100%,53%)] transition-colors duration-200 cursor-pointer"
              onClick={() => handleRedirect("/login")}
            >
              <div className="w-8 h-8 bg-[hsl(23,100%,53%)] rounded-full flex items-center justify-center">
                <User size={16} className="text-black" />
              </div>
              <span className="hidden md:block text-sm font-medium"></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
