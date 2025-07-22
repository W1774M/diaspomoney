"use client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  FormLabel,
  Input,
} from "@/components/ui";
import { useForm } from "@/hooks/forms/useForm";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token de réinitialisation manquant");
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    schema: resetPasswordSchema,
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Token de réinitialisation manquant");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Erreur lors de la réinitialisation");
      }
    } catch {
      setError("Erreur réseau ou serveur");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl">
          <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-4">
            <Image
              src="/img/Logo_Diaspo_Horizontal_enrichi.webp"
              alt="DiaspoMoney"
              width={160}
              height={48}
              className="mb-2 drop-shadow-md"
              priority
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-blue-800 tracking-tight text-center">
              Mot de passe mis à jour !
            </CardTitle>
            <CardDescription className="text-blue-600 text-base text-center">
              Votre mot de passe a été réinitialisé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 px-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de
                passe.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Aller à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl">
          <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-4">
            <Image
              src="/img/Logo_Diaspo_Horizontal_enrichi.webp"
              alt="DiaspoMoney"
              width={160}
              height={48}
              className="mb-2 drop-shadow-md"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
            <CardTitle className="text-2xl font-extrabold text-red-800 tracking-tight text-center">
              Lien invalide
            </CardTitle>
            <CardDescription className="text-red-600 text-base text-center">
              Ce lien de réinitialisation est invalide ou a expiré
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 px-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Veuillez demander un nouveau lien de récupération.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="backdrop-blur-md bg-white/70 border-0 shadow-xl rounded-3xl">
        <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-4">
          <Image
            src="/img/Logo_Diaspo_Horizontal_enrichi.webp"
            alt="DiaspoMoney"
            width={160}
            height={48}
            className="mb-2 drop-shadow-md"
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          <CardTitle className="text-2xl font-extrabold text-blue-800 tracking-tight text-center">
            Nouveau mot de passe
          </CardTitle>
          <CardDescription className="text-blue-600 text-base text-center">
            Définissez votre nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6 px-6">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormField
              error={
                typeof errors.password?.message === "string"
                  ? errors.password?.message
                  : undefined
              }
            >
              <FormLabel
                htmlFor="password"
                className="text-blue-900 font-semibold"
              >
                Nouveau mot de passe
              </FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className="rounded-xl focus:ring-2 focus:ring-blue-400 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </FormField>
            <FormField
              error={
                typeof errors.confirmPassword?.message === "string"
                  ? errors.confirmPassword?.message
                  : undefined
              }
            >
              <FormLabel
                htmlFor="confirmPassword"
                className="text-blue-900 font-semibold"
              >
                Confirmer le mot de passe
              </FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className="rounded-xl focus:ring-2 focus:ring-blue-400 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </FormField>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Chargement en cours ...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
