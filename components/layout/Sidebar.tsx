"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import {
  Building,
  Calendar,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  Home,
  LogOut,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../ui/Logo";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isProvider, isCSM, isAuthenticated, isCustomer, signOut } =
    useAuth();

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, show: true },
    {
      name: "Utilisateurs",
      href: "/dashboard/users",
      icon: Users,
      show: isAdmin(),
    },
    {
      name: "Nouveaux prestataires",
      href: "/dashboard/providers/new",
      icon: UserPlus,
      show: isCSM(),
    },
    {
      name: "Spécialités",
      href: "/dashboard/specialities",
      icon: Building,
      show: isAdmin(),
    },
    {
      name: "Rendez-vous",
      href: "/dashboard/appointments",
      icon: Calendar,
      show: true,
    },
    {
      name: "Mes disponibilités",
      href: "/dashboard/availabilities",
      icon: Clock,
      show: isProvider(),
    },
    {
      name: "Contacts prestataires",
      href: "/dashboard/providers/contacts",
      icon: Eye,
      show: isCSM(),
    },
    {
      name: "Mes beneficiaires",
      href: "/dashboard/beneficiaries",
      icon: Users,
      show: isCustomer(),
    },
    {
      name: "Devenir prestataire",
      href: "/dashboard/providers/apply",
      icon: Building,
      show: isCustomer(),
    },
    {
      name: "Historique des services",
      href: "/dashboard/services/history",
      icon: Calendar,
      show: true,
    },
    {
      name: "Suivi des services",
      href: "/dashboard/services/tracking",
      icon: Calendar,
      show: isCustomer(),
    },
    {
      name: "Factures",
      href: "/dashboard/invoices",
      icon: FileText,
      show: true,
    },
    {
      name: "Mes Devis",
      href: "/dashboard/quotes",
      icon: FileText,
      show: isCustomer(),
    },
    {
      name: "Réclamations",
      href: "/dashboard/complaints",
      icon: AlertTriangle,
      show: isCustomer(),
    },
  ];

  const visibleNavigation = navigation.filter(item => item.show);

  return (
    <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
      {/* Section utilisateur en haut */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center">
            {/* <User className="h-5 w-5 text-white" /> */}
            <Logo
              src={user?.avatar?.image || ""}
              width={60}
              height={60}
              alt={user?.avatar?.name || ""}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "Utilisateur"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ""}
            </p>
            <div className="flex items-center mt-1">
              {user?.roles?.map(role => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <nav className="p-6">
        <div className="space-y-2">
          {visibleNavigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-gray-700 bg-[hsl(25,100%,53%)]/10"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900"
          >
            <Settings className="h-5 w-5 mr-3" />
            Paramètres
          </Link>

          <button
            onClick={signOut}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 w-full"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </nav>
    </aside>
  );
}
