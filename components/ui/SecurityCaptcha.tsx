"use client";
import { RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";

interface SecurityCaptchaProps {
  onSuccess: () => void;
  onFail: () => void;
  maxAttempts?: number;
  className?: string;
}

interface CaptchaChallenge {
  question: string;
  answer: number;
  options: number[];
}

export function SecurityCaptcha({
  onSuccess,
  onFail,
  maxAttempts = 3,
  className = "",
}: SecurityCaptchaProps) {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Générer un nouveau défi captcha
  const generateChallenge = useCallback(() => {
    const operations = [
      {
        op: "+",
        fn: (a: number, b: number) => a + b,
        symbol: "+",
      },
      {
        op: "-",
        fn: (a: number, b: number) => a - b,
        symbol: "-",
      },
      {
        op: "*",
        fn: (a: number, b: number) => a * b,
        symbol: "×",
      },
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = operation.fn(num1, num2);

    // Générer des options incorrectes
    const options = [answer];
    while (options.length < 4) {
      const wrongAnswer = answer + Math.floor(Math.random() * 10) - 5;
      if (wrongAnswer !== answer && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    // Mélanger les options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    setChallenge({
      question: `Quel est le résultat de ${num1} ${operation.symbol} ${num2} ?`,
      answer,
      options: shuffledOptions,
    });
  }, []);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!challenge) return;

    const selectedAnswer = parseInt(userAnswer);

    if (selectedAnswer === challenge.answer) {
      // Succès
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      // Échec
      setAttempts((prev) => prev + 1);
      setError("Réponse incorrecte. Veuillez réessayer.");
      setUserAnswer("");

      if (attempts + 1 >= maxAttempts) {
        setTimeout(() => {
          onFail();
        }, 1000);
      } else {
        // Générer un nouveau défi
        setTimeout(() => {
          generateChallenge();
        }, 1000);
      }
    }

    setIsLoading(false);
  };

  const handleRefresh = () => {
    setError(null);
    setUserAnswer("");
    generateChallenge();
  };

  if (!challenge) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 ${className}`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Vérification de sécurité
          </h3>
          <p className="text-sm text-gray-600">
            Résolvez ce problème pour continuer
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-lg font-medium text-gray-800 mb-4">
            {challenge.question}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {challenge.options.map((option, index) => (
              <button
                key={`captcha-option-${index}`}
                type="button"
                onClick={() => setUserAnswer(option.toString())}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  userAnswer === option.toString()
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Tentatives restantes : {maxAttempts - attempts}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Nouveau problème</span>
          </button>

          <Button
            type="submit"
            disabled={!userAnswer || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {isLoading ? "Vérification..." : "Vérifier"}
          </Button>
        </div>
      </form>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Cette vérification protège contre les attaques automatisées
        </p>
      </div>
    </div>
  );
}
