"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  variant?: "sidebar" | "header" | "mobile";
}

export function SignOutButton({
  className = "",
  showIcon = true,
  children,
  variant = "sidebar",
}: SignOutButtonProps) {
  const { signOut, isSigningOut } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    if (showConfirm) {
      await signOut();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "transition-colors";

    switch (variant) {
      case "sidebar":
        return `${baseClasses} flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 w-full disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
      case "header":
        return `${baseClasses} block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
      case "mobile":
        return `${baseClasses} block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
      default:
        return `${baseClasses} ${className}`;
    }
  };

  const getButtonText = () => {
    if (isSigningOut) return "Déconnexion...";
    if (showConfirm) return "Confirmer ?";
    return children || "Déconnexion";
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={getButtonClasses()}
    >
      {showIcon && variant === "sidebar" && <LogOut className="h-5 w-5 mr-3" />}
      {showIcon && variant === "header" && <LogOut className="h-4 w-4 mr-2" />}
      {showIcon && variant === "mobile" && <LogOut className="h-4 w-4 mr-2" />}
      {getButtonText()}
    </button>
  );
}
