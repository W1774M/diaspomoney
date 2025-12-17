import { ArrowRight } from "lucide-react";

export default function HowItWorks({ className, bgColor, textColor }: { className?: string, bgColor?: string, textColor?: string }) {
  const steps = [
    {
      number: "01",
      title: "Avant le paiement",
      subtitle: "Préparation et sélection",
      description:
        "Choisissez le service, et préparez votre dossier.",
      items: [
        "Information du bénéficiaire/contact local et pour vous-même",
        "Choix des disponibilités pour le service",
      ],
    },
    {
      number: "02",
      title: "Sélection du service et des options",
      subtitle: "Sélection du service et des options",
      description:
        "Sélectionnez le service et les options pour votre bénéficiaire/contact local ou pour vous-même.",
      items: [
        "Choix d'un service et plusieurs options si besoin",
        "Évaluation des coûts et préparation du paiement",
      ],
    },
    {
      number: "03",
      title: "Paiement sécurisé",
      subtitle: "Transaction garantie",
      description:
        "Effectuez le paiement via notre plateforme sécurisée avec garantie de remboursement.",
      items: [
        "Paiement sécurisé par carte ou virement",
        "Garantie DiaspoMoney (remboursement si non exécuté)",
        "Confirmation immédiate de paiement",
        "Suivi en temps réel de la transaction",
      ],
    },
    {
      number: "04",
      title: "Suivi du service",
      subtitle: "Confirmation et support",
      description:
        "Recevez la confirmation d'exécution et bénéficiez de notre support continu.",
      items: [
        "Vous serez recontacté rapidement pour le suivi",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={`${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Un accompagnement simple, étape par étape
          </h2>
          <p className={`text-lg ${textColor} max-w-3xl mx-auto`}>
            Avant et après le paiement, avant le service et après l&apos;exécution&nbsp;|&nbsp;on est là à chaque moment clé.
          </p>
        </div>

        <div className="space-y-12 max-w-5xl mx-auto">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="flex-shrink-0">
                <div className={`w-20 h-20 rounded-full ${bgColor} text-black flex items-center justify-center text-2xl font-bold`}>
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-lg text-black italic">
                    {step.subtitle}
                  </p>
                </div>
                <p className="text-black mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2">
                      <ArrowRight className="w-5 h-5 text-[hsl(25,100%,53%)] flex-shrink-0 mt-0.5" />
                      <span className="text-black">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}