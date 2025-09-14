import { useNotificationManager } from "@/components/ui/Notification";
import { MessageCircle } from "lucide-react";

interface WhatsAppLoginButtonProps {
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}

export function WhatsAppLoginButton({ onError }: WhatsAppLoginButtonProps) {
  const { addInfo, addError } = useNotificationManager();

  const handleWhatsAppLogin = async () => {
    try {
      addInfo("Connexion WhatsApp temporairement désactivée");

      if (onError) {
        onError(new Error("Connexion WhatsApp non disponible"));
      }
    } catch (error) {
      console.error("Erreur lors de la connexion WhatsApp:", error);
      addError("Erreur lors de la connexion WhatsApp");

      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleWhatsAppLogin}
      className="w-full flex items-center justify-center px-4 py-2 mt-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-lg shadow transition-colors duration-200 cursor-pointer"
    >
      <MessageCircle className="w-5 h-5 mr-2" />
      Continuer avec WhatsApp
    </button>
  );
}
