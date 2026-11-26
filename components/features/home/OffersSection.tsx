import Link from "next/link";
import { Check, GraduationCap, Heart, Home, type LucideIcon } from "lucide-react";

/** Ancre de la section sur la home : cible des liens « Nos services » / « Commencer ». */
export const OFFERS_SECTION_ID = "services";

interface ServiceOffer {
  /** Segment de route de la page détail : /services/[id] */
  id: "health" | "edu" | "immo";
  title: string;
  description: string;
  price: string;
  delivery: string;
  features: string[];
  cta: string;
  Icon: LucideIcon;
  iconClassName: string;
}

const SERVICE_OFFERS: ServiceOffer[] = [
  {
    id: "health",
    title: "Santé",
    description: "Accès à un réseau de professionnels de santé certifiés",
    price: "À partir de 10€",
    delivery: "Rendez-vous sous 24-48h",
    features: [
      "Réseau de médecins vérifiés",
      "Consultation en présentiel ou téléconsultation",
      "Paiement sécurisé",
      "Rapport médical inclus",
    ],
    cta: "Prendre rendez-vous",
    Icon: Heart,
    iconClassName: "text-red-500",
  },
  {
    id: "edu",
    title: "Éducation",
    description: "Paiement direct et sécurisé des frais d'éducation",
    price: "Selon établissement",
    delivery: "Paiement sous 48h",
    features: [
      "Paiement direct à l'établissement",
      "Reçu officiel garanti",
      "Suivi de paiement en temps réel",
      "Support pour les démarches administratives",
    ],
    cta: "Payer les frais de scolarité",
    Icon: GraduationCap,
    iconClassName: "text-brand-700",
  },
  {
    id: "immo",
    title: "Immobilier",
    description:
      "Accompagnement dans la recherche, la location et la construction de biens immobiliers",
    price: "À partir de 100€",
    delivery: "Proposition sous 7 jours",
    features: [
      "Recherche personnalisée selon vos critères",
      "Faire déplacer un professionnel pour un devis",
      "Visites guidées",
      "Support jusqu'à la signature du contrat",
    ],
    cta: "Demander un devis",
    Icon: Home,
    iconClassName: "text-green-500",
  },
];

export function OffersSection() {
  return (
    <section
      id={OFFERS_SECTION_ID}
      aria-labelledby="offers-title"
      className="scroll-mt-4 py-16 md:py-20 bg-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="offers-title"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Nos offres
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Maximisez votre impact avec nos services complets, conçus pour vous
            accompagner à chaque étape du soutien à vos proches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICE_OFFERS.map(
            ({ id, title, description, price, delivery, features, cta, Icon, iconClassName }) => (
              <article
                key={id}
                className="flex flex-col bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <Icon className={`w-10 h-10 mb-3 ${iconClassName}`} aria-hidden="true" />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 mb-4 md:min-h-12">{description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-brand-700">{price}</span>
                  <p className="text-sm text-gray-500 mt-1">{delivery}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services/${id}`}
                  className="mt-auto block w-full text-center bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition"
                >
                  {cta}
                </Link>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
