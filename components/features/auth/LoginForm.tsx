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
import { useNotificationManager } from "@/components/ui/Notification";
import { useForm } from "@/hooks/forms/useForm";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { MOCK_USERS } from "@/mocks";
import { authActions, useAuth, useDispatch } from "@/store/simple-store";
import { AlertCircle, Clock, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Custom hook for URL status handling
const useUrlStatus = () => {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStatus = urlParams.get("status");
    setStatus(urlStatus);
  }, []);

  return status;
};

export function LoginForm() {
  const router = useRouter();
  const { addSuccess, addError, addWarning, addInfo } =
    useNotificationManager();
  const { isLoading, error } = useAuth();
  const dispatch = useDispatch();
  const urlStatus = useUrlStatus();

  // Vérifier les paramètres d'URL pour les messages de statut
  useEffect(() => {
    // Prevent infinite loops by checking if we've already processed this status
    if (urlStatus && !error) {
      if (urlStatus === "pending") {
        dispatch(authActions.loginFailure("COMPTE_EN_ATTENTE"));
        addInfo(
          "Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt."
        );
      } else if (urlStatus === "suspended") {
        dispatch(authActions.loginFailure("COMPTE_SUSPENDU"));
        addError(
          "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations."
        );
      }
    }
  }, [urlStatus, addInfo, addError, error, dispatch]);

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

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const session = localStorage.getItem("user-session");
    if (session) {
      // L'utilisateur est déjà connecté, rediriger
      router.push("/dashboard");
    }
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    dispatch(authActions.loginStart());

    try {
      // Simuler un délai de connexion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Rechercher l'utilisateur dans MOCK_USERS
      const user = MOCK_USERS.find(u => u.email === data.email);

      if (user && user.password === data.password) {
        // Vérifier le statut du compte
        if (user.status === "INACTIVE") {
          dispatch(authActions.loginFailure("COMPTE_INACTIF"));
          addWarning(
            "Votre compte n'est pas encore activé. Veuillez vérifier votre boîte mail et cliquer sur le lien de vérification envoyé par DiaspoMoney."
          );
          return;
        }

        if (user.status === "PENDING") {
          dispatch(authActions.loginFailure("COMPTE_EN_ATTENTE"));
          addInfo(
            "Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt."
          );
          return;
        }

        if (user.status === "SUSPENDED") {
          dispatch(authActions.loginFailure("COMPTE_SUSPENDU"));
          addError(
            "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations."
          );
          return;
        }

        // Seuls les comptes ACTIVE peuvent se connecter
        if (user.status === "ACTIVE") {
          // Créer une session locale
          const session = {
            user: {
              id: user._id,
              email: user.email,
              name: user.name,
              roles: user.roles,
              status: user.status,
              avatar: user.avatar,
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
          };

          // Sauvegarder en localStorage
          localStorage.setItem("user-session", JSON.stringify(session));

          // Déclencher l'événement personnalisé pour notifier les autres composants
          window.dispatchEvent(new CustomEvent("user-session-changed"));

          // Dispatch success action
          dispatch(authActions.loginSuccess(user));

          addSuccess("Connexion réussie ! Redirection en cours...");

          // Redirection vers le dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        dispatch(authActions.loginFailure("Email ou mot de passe incorrect"));
        addError("Email ou mot de passe incorrect");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      dispatch(authActions.loginFailure("Une erreur est survenue"));
      addError("Erreur lors de la connexion. Veuillez réessayer.");
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
            <FormField error={errors.email?.message ?? ""}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="exemple@email.com"
              />
            </FormField>
            <FormField error={errors.password?.message ?? ""}>
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

            {/* Boutons de test pour les différents statuts */}
            {/* <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs text-gray-600 mb-2 font-medium">
                🧪 Test des statuts de compte :
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) {
                      const emailInput = form.querySelector(
                        "#email"
                      ) as HTMLInputElement;
                      const passwordInput = form.querySelector(
                        "#password"
                      ) as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = "customer@diaspomoney.com";
                        passwordInput.value = "password123";
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Compte Actif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) {
                      const emailInput = form.querySelector(
                        "#email"
                      ) as HTMLInputElement;
                      const passwordInput = form.querySelector(
                        "#password"
                      ) as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = "customer.inactive@diaspomoney.com";
                        passwordInput.value = "password123";
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                >
                  Compte Inactif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) {
                      const emailInput = form.querySelector(
                        "#email"
                      ) as HTMLInputElement;
                      const passwordInput = form.querySelector(
                        "#password"
                      ) as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = "customer.pending@diaspomoney.com";
                        passwordInput.value = "password123";
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  En Attente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector("form");
                    if (form) {
                      const emailInput = form.querySelector(
                        "#email"
                      ) as HTMLInputElement;
                      const passwordInput = form.querySelector(
                        "#password"
                      ) as HTMLInputElement;
                      if (emailInput && passwordInput) {
                        emailInput.value = "customer.suspended@diaspomoney.com";
                        passwordInput.value = "password123";
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Suspendu
                </button>
              </div>
            </div> */}

            {error && (
              <div
                className={`mt-2 p-3 border rounded-md ${
                  error === "COMPTE_INACTIF"
                    ? "bg-yellow-50 border-yellow-200"
                    : error === "COMPTE_EN_ATTENTE"
                      ? "bg-blue-50 border-blue-200"
                      : error === "COMPTE_SUSPENDU"
                        ? "bg-red-50 border-red-200"
                        : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {error === "COMPTE_INACTIF" && (
                    <Mail className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {error === "COMPTE_EN_ATTENTE" && (
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  {error === "COMPTE_SUSPENDU" && (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  {error !== "COMPTE_INACTIF" &&
                    error !== "COMPTE_EN_ATTENTE" &&
                    error !== "COMPTE_SUSPENDU" && (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        error === "COMPTE_INACTIF"
                          ? "text-yellow-700"
                          : error === "COMPTE_EN_ATTENTE"
                            ? "text-blue-700"
                            : error === "COMPTE_SUSPENDU"
                              ? "text-red-600"
                              : "text-red-600"
                      }`}
                    >
                      {error === "COMPTE_INACTIF" && "Compte inactif"}
                      {error === "COMPTE_EN_ATTENTE" &&
                        "Compte en attente de vérification"}
                      {error === "COMPTE_SUSPENDU" && "Compte suspendu"}
                      {error !== "COMPTE_INACTIF" &&
                        error !== "COMPTE_EN_ATTENTE" &&
                        error !== "COMPTE_SUSPENDU" &&
                        error}
                      {error === "COMPTE_INACTIF" && (
                        <span className="block mt-2 space-y-1">
                          <a
                            href="/verify-email"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            📧 Renvoyer l'email de vérification
                          </a>
                          <a
                            href="/support"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            🆘 Besoin d'aide ? Contactez le support
                          </a>
                        </span>
                      )}
                      {error === "COMPTE_EN_ATTENTE" && (
                        <span className="block mt-2 space-y-1">
                          <a
                            href="/support"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            🆘 Contacter le support pour accélérer la
                            vérification
                          </a>
                          <a
                            href="/hotline"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            📞 Appeler la hotline
                          </a>
                        </span>
                      )}
                      {error === "COMPTE_SUSPENDU" && (
                        <span className="block mt-2 space-y-1">
                          <a
                            href="/support"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            🆘 Contacter le support pour plus d'informations
                          </a>
                          <a
                            href="/hotline"
                            className="text-blue-600 hover:underline font-medium block"
                          >
                            📞 Appeler la hotline d'urgence
                          </a>
                        </span>
                      )}
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
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-600 cursor-pointer mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>

            {/* Test buttons for different account statuses */}
            {process.env.NODE_ENV === "test" && (
              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Fill form fields with test data
                    const emailInput = document.getElementById(
                      "email"
                    ) as HTMLInputElement;
                    const passwordInput = document.getElementById(
                      "password"
                    ) as HTMLInputElement;
                    if (emailInput && passwordInput) {
                      emailInput.value = "customer@diaspomoney.com";
                      passwordInput.value = "password123";
                      // Trigger change events
                      emailInput.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                      passwordInput.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                    }
                    // Simulate successful login for testing
                    dispatch(
                      authActions.loginSuccess({
                        _id: "test-user",
                        email: "customer@diaspomoney.com",
                        name: "Test User",
                        roles: ["USER"],
                        status: "ACTIVE",
                      })
                    );
                  }}
                  className="w-full"
                >
                  Compte Actif
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch(authActions.loginFailure("COMPTE_INACTIF"));
                    addWarning(
                      "Votre compte n'est pas encore activé. Veuillez vérifier votre boîte mail et cliquer sur le lien de vérification envoyé par DiaspoMoney."
                    );
                  }}
                  className="w-full"
                >
                  Compte Inactif
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch(authActions.loginFailure("COMPTE_EN_ATTENTE"));
                    addInfo(
                      "Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt."
                    );
                  }}
                  className="w-full"
                >
                  En Attente
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch(authActions.loginFailure("COMPTE_SUSPENDU"));
                    addError(
                      "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations."
                    );
                  }}
                  className="w-full"
                >
                  Suspendu
                </Button>
              </div>
            )}
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <a
              href="/register"
              className="font-semibold text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,45%)] transition-colors duration-200"
            >
              S&apos;inscrire
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
