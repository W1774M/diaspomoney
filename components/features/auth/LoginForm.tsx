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
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { useRouter } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, setError } = useAuthStore();
  const { addNotification } = useNotificationStore();

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      addNotification({
        type: "success",
        message: "Connexion réussie !",
        duration: 3000,
      });
      router.push("/dashboard");
    } catch (error) {
      addNotification({
        type: "error",
        message:
          error instanceof Error ? error.message : "Une erreur est survenue",
        duration: 5000,
      });
      setError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
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
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-600 cursor-pointer"
              isLoading={isLoading}
            >
              Se connecter
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
