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
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    schema: registerSchema,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    } catch {
      setError("Erreur réseau ou serveur");
    } finally {
      setIsLoading(false);
    }
  };

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
            Créez votre compte DiaspoMoney
          </CardTitle>
          <CardDescription className="text-blue-600 text-base text-center">
            Plateforme sécurisée pour vos services en Afrique
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6 px-6">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField error={errors.firstName?.message}>
                <FormLabel
                  htmlFor="firstName"
                  className="text-blue-900 font-semibold"
                >
                  Prénom
                </FormLabel>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="Votre prénom"
                  className="rounded-xl focus:ring-2 focus:ring-blue-400"
                />
              </FormField>
              <FormField error={errors.lastName?.message}>
                <FormLabel
                  htmlFor="lastName"
                  className="text-blue-900 font-semibold"
                >
                  Nom
                </FormLabel>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Votre nom"
                  className="rounded-xl focus:ring-2 focus:ring-blue-400"
                />
              </FormField>
            </div>
            <FormField error={errors.email?.message}>
              <FormLabel
                htmlFor="email"
                className="text-blue-900 font-semibold"
              >
                Email
              </FormLabel>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="exemple@email.com"
                className="rounded-xl focus:ring-2 focus:ring-blue-400"
              />
            </FormField>
            <FormField error={errors.phone?.message}>
              <FormLabel
                htmlFor="phone"
                className="text-blue-900 font-semibold"
              >
                Téléphone
              </FormLabel>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="Votre numéro (optionnel)"
                className="rounded-xl focus:ring-2 focus:ring-blue-400"
              />
            </FormField>
            <FormField error={errors.password?.message}>
              <FormLabel
                htmlFor="password"
                className="text-blue-900 font-semibold"
              >
                Mot de passe
              </FormLabel>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="rounded-xl focus:ring-2 focus:ring-blue-400"
              />
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
              {isLoading ? "Création du compte..." : "Créer un compte"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-8">
          <p className="text-sm text-blue-700">
            Déjà un compte ?{" "}
            <a
              href="/login"
              className="font-semibold underline hover:text-indigo-700 transition-colors duration-200"
            >
              Se connecter
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
