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
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    schema: forgotPasswordSchema,
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Erreur lors de l'envoi de l'email");
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
              Email envoyé !
            </CardTitle>
            <CardDescription className="text-blue-600 text-base text-center">
              Si cet email existe dans notre base de données, vous recevrez un
              lien de récupération.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 px-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Vérifiez votre boîte de réception et suivez les instructions
                pour réinitialiser votre mot de passe.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
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
          />
          <CardTitle className="text-2xl font-extrabold text-blue-800 tracking-tight text-center">
            Mot de passe oublié ?
          </CardTitle>
          <CardDescription className="text-blue-600 text-base text-center">
            Entrez votre email pour recevoir un lien de récupération
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6 px-6">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.email?.message}>
              <FormLabel
                htmlFor="email"
                className="text-blue-900 font-semibold"
              >
                Email
              </FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="exemple@email.com"
                  className="rounded-xl focus:ring-2 focus:ring-blue-400 pl-10"
                />
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
              {isLoading
                ? "Envoi en cours..."
                : "Envoyer le lien de récupération"}
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
