"use client";
import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showPassword = false,
  onTogglePassword,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([]);

  useEffect(() => {
    const newRequirements: PasswordRequirement[] = [
      {
        label: "Au moins 8 caractères",
        test: pwd => pwd.length >= 8,
        met: false,
      },
      {
        label: "Au moins une majuscule",
        test: pwd => /[A-Z]/.test(pwd),
        met: false,
      },
      {
        label: "Au moins une minuscule",
        test: pwd => /[a-z]/.test(pwd),
        met: false,
      },
      {
        label: "Au moins un chiffre",
        test: pwd => /\d/.test(pwd),
        met: false,
      },
      {
        label: "Au moins un caractère spécial",
        test: pwd => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        met: false,
      },
    ];

    newRequirements.forEach(req => {
      req.met = req.test(password);
    });

    setRequirements(newRequirements);
  }, [password]);

  const metRequirements = requirements.filter(req => req.met).length;
  const totalRequirements = requirements.length;
  const strengthPercentage = (metRequirements / totalRequirements) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage === 0) return "bg-gray-200";
    if (strengthPercentage <= 20) return "bg-red-500";
    if (strengthPercentage <= 40) return "bg-orange-500";
    if (strengthPercentage <= 60) return "bg-yellow-500";
    if (strengthPercentage <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strengthPercentage === 0) return "Très faible";
    if (strengthPercentage <= 20) return "Très faible";
    if (strengthPercentage <= 40) return "Faible";
    if (strengthPercentage <= 60) return "Moyen";
    if (strengthPercentage <= 80) return "Fort";
    return "Très fort";
  };

  const getStrengthTextColor = () => {
    if (strengthPercentage === 0) return "text-gray-500";
    if (strengthPercentage <= 20) return "text-red-500";
    if (strengthPercentage <= 40) return "text-orange-500";
    if (strengthPercentage <= 60) return "text-yellow-600";
    if (strengthPercentage <= 80) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Force du mot de passe
          </span>
          <span className={`text-sm font-semibold ${getStrengthTextColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strengthPercentage}%` }}
            role="progressbar"
            aria-valuenow={strengthPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Exigences */}
      {password.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Exigences ({metRequirements}/{totalRequirements})
          </p>
          <div className="space-y-1">
            {requirements.map((requirement, index) => (
              <div
                key={`requirement-${index}`}
                className="flex items-center space-x-2 text-sm"
              >
                {requirement.met ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span
                  className={
                    requirement.met
                      ? "text-green-700 line-through"
                      : "text-gray-600"
                  }
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton pour afficher/masquer le mot de passe */}
      {onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          {showPassword ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Masquer le mot de passe</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Afficher le mot de passe</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
