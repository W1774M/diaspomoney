import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente (CGV) - DiaspoMoney',
  description: 'Conditions Générales de Vente de DiaspoMoney',
};

export default function TermsOfSalePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Conditions Générales de Vente (CGV)
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. OBJET</h2>
              <p className="text-gray-700 mb-4">
                Les présentes CGV s’appliquent à toute commande passée via la plateforme par un client
                pour la réalisation d’une prestation par un prestataire référencé.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. DÉFINITIONS</h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Client : Donneur d’ordre, déclencheur de l’opération.</li>
                <li>Bénéficiaire : Destinataire final de la prestation commandée.</li>
                <li>Prestataire : Professionnel de santé, éducation ou immobilier référencé.</li>
                <li>
                  Intermédiaire local : Personne morale ou physique supervisant les opérations pour
                  DiaspoMoney.
                </li>
                <li>Plateforme : Site web DiaspoMoney.fr et ses fonctionnalités techniques.</li>
                <li>Commande : Acceptation expresse d’une proposition (devis).</li>
                <li>Devis : Document précisant la nature, le prix et les conditions.</li>
                <li>Acompte : Somme versée à la confirmation de la commande.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. COMMANDE</h2>
              <p className="text-gray-700 mb-4">
                Le client sélectionne une prestation, valide un devis, l’accepte via signature
                électronique ou bouton de validation, puis reçoit un mail récapitulatif.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. TARIFS ET PAIEMENT
              </h2>
              <p className="text-gray-700 mb-4">
                Les prix sont indiqués en euros TTC. Le paiement s’effectue uniquement en ligne via
                solution sécurisée.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. DROIT DE RÉTRACTATION
              </h2>
              <p className="text-gray-700 mb-4">
                Délai légal de 14 jours, sauf exécution immédiate et urgente de la prestation avec
                accord du client.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. EXÉCUTION DE LA PRESTATION
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney supervise le bon déroulement de la prestation, sans intervenir dans le
                contenu technique. Le prestataire est responsable de ses erreurs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. OBLIGATIONS DU CLIENT
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Fournir des informations exactes sur le bénéficiaire</li>
                <li>Payer intégralement les frais liés à la commande</li>
                <li>Coopérer avec les intervenants</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. RESPONSABILITÉ</h2>
              <p className="text-gray-700 mb-4">
                La responsabilité de DiaspoMoney est limitée aux préjudices directs, dans la limite des
                sommes perçues au titre de la commande.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. FORCE MAJEURE</h2>
              <p className="text-gray-700 mb-4">
                Événements extérieurs, imprévisibles et irrésistibles exonèrent de responsabilité.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. NULLITÉ PARTIELLE
              </h2>
              <p className="text-gray-700 mb-4">
                Si une clause est jugée invalide, les autres restent applicables.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. RÉCLAMATIONS ET MÉDIATION
              </h2>
              <p className="text-gray-700 mb-4">
                Les réclamations peuvent être adressées à DiaspoMoney. En cas d’échec, le litige sera
                porté devant les juridictions françaises, tribunal compétent : Cour d’appel de Rouen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. LOI APPLICABLE</h2>
              <p className="text-gray-700 mb-4">
                Les présentes CGV sont régies par le droit français.
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
