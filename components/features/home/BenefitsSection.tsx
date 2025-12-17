import { BenefitCard } from "./BenefitCard";

const BENEFITS = [
  {
    icon: "✅",
    iconBgColor: "bg-green-100",
    iconTextColor: "text-green-600",
    title: "Prestataires vérifiés",
    description:
      "Tous nos prestataires sont rigoureusement sélectionnés et font l&apos;objet d&apos;un suivi continu.",
  },
  {
    icon: "💳",
    iconBgColor: "bg-blue-100",
    iconTextColor: "text-blue-600",
    title: "Économies garanties",
    description:
      "Économisez jusquà 15-30% par rapport aux transferts d&apos;argent traditionnels.",
  },
  {
    icon: "⏰",
    iconBgColor: "bg-amber-100",
    iconTextColor: "text-amber-600",
    title: "Suivi en temps réel",
    description:
      "Suivez l&apos;avancement du service et recevez des notifications à chaque étape.",
  },
  {
    icon: "📞",
    iconBgColor: "bg-purple-100",
    iconTextColor: "text-purple-600",
    title: "Support local",
    description:
      "Nos Country Sales Managers sur place assurent la qualité d&apos;exécution des services.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 md:py-24  bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] text-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Pourquoi choisir DiaspoMoney ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            Une plateforme sécurisée et transparente pour vos transferts de services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {BENEFITS.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
}

