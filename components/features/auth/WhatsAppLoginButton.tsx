import { useNotificationManager } from "@/components/ui/Notification";
import { MessageCircle } from "lucide-react";

interface WhatsAppLoginButtonProps {
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}

export function WhatsAppLoginButton({ onError: _onError }: WhatsAppLoginButtonProps) {
  const { addInfo, addError } = useNotificationManager();

  const handleWhatsAppLogin = async () => {
    try {
      const phone = process.env["NEXT_PUBLIC_WHATSAPP_PHONE"] ?? "";
      const message = process.env["NEXT_PUBLIC_WHATSAPP_MESSAGE"] ?? "Bonjour, je souhaite me connecter avec WhatsApp";

      if (!phone) {
        throw new Error("NEXT_PUBLIC_WHATSAPP_PHONE manquant");
      }

      const encoded = encodeURIComponent(message);
      const url = `https://wa.me/${phone}?text=${encoded}`;
      addInfo("Ouverture de WhatsApp...");
      window.location.href = url;
    } catch (error) {
      console.error("Erreur lors de la connexion WhatsApp:", error);
      addError("Erreur lors de la connexion WhatsApp");

      if (_onError) {
        _onError(error);
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
