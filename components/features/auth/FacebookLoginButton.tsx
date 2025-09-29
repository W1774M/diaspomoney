import { useNotificationManager } from "@/components/ui/Notification";
import { signIn } from "next-auth/react";

interface FacebookLoginButtonProps {
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}

export function FacebookLoginButton({ onError }: FacebookLoginButtonProps) {
  const { addInfo, addError } = useNotificationManager();

  const handleFacebookLogin = async () => {
    try {
      addInfo("Redirection vers Facebook...");
      await signIn("facebook", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Erreur lors de la connexion Facebook:", error);
      addError("Erreur lors de la connexion Facebook");

      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      className="w-full flex items-center justify-center px-4 py-2 mt-3 bg-[#1877f2] hover:bg-[#145db2] text-white font-semibold rounded-lg shadow transition-colors duration-200 cursor-pointer"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692V11.01h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.312h3.587l-.467 3.696h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"
        />
      </svg>
      Continuer avec Facebook
    </button>
  );
}
