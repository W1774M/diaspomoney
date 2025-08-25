"use client";
import DefaultTemplate from "@/template/DefaultTemplate";

export default function ForgotPasswordPage() {
  return (
    <DefaultTemplate>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        {/* Le composant ForgotPasswordForm est manquant ou mal importé */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Mot de passe oublié
          </h1>
          <p className="mb-6 text-center text-gray-600">
            Entrez votre adresse email pour recevoir un lien de
            réinitialisation.
          </p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (
                form.elements.namedItem("email") as HTMLInputElement
              )?.value;
              if (!email) {
                alert("Veuillez entrer une adresse email.");
                return;
              }
              try {
                const res = await fetch("/api/auth/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const data = await res.json();
                if (res.ok) {
                  alert(
                    "Un email de réinitialisation a été envoyé si l'adresse existe."
                  );
                } else {
                  alert(data.error || "Erreur lors de l'envoi de l'email.");
                }
              } catch {
                alert("Erreur réseau ou serveur.");
              }
            }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Votre email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition-colors"
            >
              Envoyer le lien de réinitialisation
            </button>
          </form>
        </div>
      </div>
    </DefaultTemplate>
  );
}
