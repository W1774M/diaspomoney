import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: "/privacy-policy",
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de DiaspoMoney : données collectées, finalités, durées de conservation et droits.",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Politique de Confidentialité (P2C)
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              En vigueur à compter du : [Date à insérer]
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Définitions Préalables Sommaires
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>
                  Donnée personnelle : Information relative à une personne physique identifiée ou
                  identifiable.
                </li>
                <li>Traitement : Toute opération réalisée sur des données.</li>
                <li>Responsable de traitement : DiaspoMoney.</li>
                <li>Sous-traitant : Prestataire tiers manipulant les données.</li>
                <li>Destinataire : Entité recevant les données (prestataires, autorités...).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Identité du Responsable de Traitement
              </h2>
              <p className="text-gray-700 mb-4">
                Le traitement est assuré par : <strong>DIASPOMONEY</strong>, (adresse), (email de
                contact).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Données Collectées
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Données d’identification : nom, prénom, email, téléphone</li>
                <li>Données de santé (le cas échéant, avec consentement)</li>
                <li>Données de paiement</li>
                <li>Données de connexion et navigation (cookies)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Finalités du Traitement
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Gérer les commandes et les relations contractuelles</li>
                <li>Sécuriser les transactions</li>
                <li>Superviser les prestations</li>
                <li>Respecter les obligations légales (KYC/AML)</li>
                <li>Améliorer la plateforme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Base Légale du Traitement
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-left text-gray-700 mb-4">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 font-semibold">Finalité</th>
                      <th className="border border-gray-200 px-4 py-2 font-semibold">Base légale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">
                        Exécution du contrat / commande
                      </td>
                      <td className="border border-gray-200 px-4 py-2">Article 6.1.b RGPD</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">KYC/AML obligations</td>
                      <td className="border border-gray-200 px-4 py-2">
                        Article 6.1.c RGPD (obligation légale)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">
                        Suivi et supervision des prestations
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        Article 6.1.f RGPD (intérêt légitime)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">
                        Amélioration et Analytics
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        Consentement ou intérêt légitime
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">
                        Communication, marketing (newsletter, offres)
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        Article 6.1.a RGPD (consentement explicite)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Durée de Conservation
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Données clients et connexions : durée relation + 3 ans</li>
                <li>KYC/AML : 5 ans après la dernière interaction</li>
                <li>Factures et preuves comptables : 10 ans</li>
                <li>Cookies et Analytics : 13 mois</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Destinataires</h2>
              <p className="text-gray-700 mb-4">Les données peuvent être transmises :</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Aux prestataires exécutants</li>
                <li>Aux intermédiaires de suivi</li>
                <li>Aux autorités administratives ou judiciaires (en cas de réquisition)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Transfert Hors UE
              </h2>
              <p className="text-gray-700 mb-4">
                Certaines données peuvent être transférées hors UE, notamment vers les pays
                d’intervention. Des garanties telles que des clauses contractuelles types et des
                engagements de confidentialité sont mises en place.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Droits des Utilisateurs
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Accès, rectification, effacement</li>
                <li>Limitation et opposition</li>
                <li>Portabilité</li>
                <li>
                  Réclamation auprès de la CNIL (
                  <Link
                    href="https://www.cnil.fr/"
                    className="text-[hsl(25,100%,53%)] hover:underline"
                  >
                    www.cnil.fr
                  </Link>
                  )
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
              <p className="text-gray-700 mb-4">La plateforme utilise des cookies pour :</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Analyser la fréquentation</li>
                <li>Personnaliser l’expérience utilisateur</li>
                <li>Gérer la sécurité</li>
              </ul>
              <p className="text-gray-700 mb-4">
                L’utilisateur peut configurer ses préférences via le bandeau dédié.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Sécurité des Données
              </h2>
              <p className="text-gray-700 mb-4">
                Des mesures techniques et organisationnelles sont mises en place : chiffrement,
                pare-feu, contrôle d’accès…
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <p className="text-gray-700 mb-4">
                Pour toute question relative à vos données personnelles :
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Email : (Email du DPO) – Objet : « Données personnelles »</li>
                <li>Adresse postale : (Adresse du DPO) – envoi recommandé</li>
              </ul>
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
