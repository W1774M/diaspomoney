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
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { useNotificationStore } from "@/store/notifications";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// const cardVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.5,
//       ease: "easeOut" as const,
//     },
//   },
// };

export function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addNotification } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Rediriger si déjà connecté
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Email ou mot de passe incorrect");
        } else {
          setError("Erreur lors de la connexion");
        }
        addNotification({
          type: "error",
          message: "Email ou mot de passe incorrect",
          duration: 5000,
        });
      } else {
        addNotification({
          type: "success",
          message: "Connexion réussie !",
          duration: 3000,
        });
        router.push("/dashboard");
      }
    } catch {
      setError("Une erreur est survenue");
      addNotification({
        type: "error",
        message: "Erreur lors de la connexion. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour accéder à vos services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormField error={errors.email?.message}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="exemple@email.com"
              />
            </FormField>
            <FormField error={errors.password?.message}>
              <FormLabel htmlFor="password">Mot de passe</FormLabel>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
              />
            </FormField>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  {error}
                  {error.includes("Aucun compte trouvé") && (
                    <span className="block mt-1">
                      <a
                        href="/register"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Cliquez ici pour vous inscrire
                      </a>
                    </span>
                  )}
                </p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-600 cursor-pointer mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <a href="/register" className="text-primary hover:underline">
              S&apos;inscrire
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
