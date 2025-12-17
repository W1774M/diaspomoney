import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos - DiaspoMoney',
  description: 'Découvrez DiaspoMoney, la plateforme de réservation de services pour la diaspora',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            À propos de DiaspoMoney
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Notre mission
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney est une plateforme innovante conçue pour faciliter la réservation de
                services en Afrique pour la diaspora. Notre mission est de créer un pont entre
                les membres de la diaspora et les prestataires de services de qualité en Afrique,
                en simplifiant le processus de réservation et de paiement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Nos services
              </h2>
              <p className="text-gray-700 mb-4">
                Nous proposons une large gamme de services dans trois catégories principales :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <strong>Santé</strong> - Accès à des cliniques, médecins et hôpitaux de qualité
                </li>
                <li>
                  <strong>Éducation</strong> - Réservation de services éducatifs, écoles et formations
                </li>
                <li>
                  <strong>BTP & Immobilier</strong> - Services de construction, rénovation et immobilier
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Pourquoi choisir DiaspoMoney ?
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney offre une solution complète et sécurisée pour réserver des services
                à distance. Notre plateforme permet de :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Réserver facilement des services depuis n&apos;importe où dans le monde</li>
                <li>Payer de manière sécurisée en ligne</li>
                <li>Accéder à un réseau de prestataires vérifiés et de qualité</li>
                <li>Bénéficier d&apos;un support client réactif</li>
                <li>Suivre vos réservations en temps réel</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Notre engagement
              </h2>
              <p className="text-gray-700 mb-4">
                Nous nous engageons à fournir une expérience utilisateur exceptionnelle, en garantissant
                la sécurité de vos données, la qualité des services proposés et un support client
                de premier ordre. Votre satisfaction est notre priorité.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contactez-nous
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question, suggestion ou demande d&apos;information, n&apos;hésitez pas à
                nous contacter à{' '}
                <Link href="mailto:support@diaspomoney.fr" className="text-[hsl(25,100%,53%)] hover:underline">
                  support@diaspomoney.fr
                </Link>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="text-[hsl(25,100%,53%)] hover:underline font-medium"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

