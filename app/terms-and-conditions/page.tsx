import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';

export const metadata: Metadata = pageMetadata({
  path: "/terms-and-conditions",
  title: "Conditions générales d’utilisation",
  description: "Conditions générales d’utilisation de la plateforme DiaspoMoney.",
});

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Conditions Générales d’Utilisation (CGU)
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              En vigueur à compter du : [Date à insérer]
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. OBJET
              </h2>
              <p className="text-gray-700 mb-4">
                Les présentes Conditions Générales d’Utilisation (CGU) définissent les modalités et
                conditions d’accès et d’utilisation de la plateforme <strong>DIASPOMONEY.FR</strong>,
                propriété de la société DIASPOMONEY, tiers de confiance dans le transfert de
                prestations vers l’Afrique (santé, éducation, immobilier).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. DÉFINITIONS
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Client : Donneur d’ordre, déclencheur de l’opération.</li>
                <li>Bénéficiaire : Destinataire final de la prestation commandée.</li>
                <li>
                  Prestataire : Professionnel du secteur de la santé, éducation ou immobilier
                  référencé.
                </li>
                <li>
                  Intermédiaire local : Personnes ou structures chargées de superviser les opérations
                  pour DiaspoMoney.
                </li>
                <li>Plateforme : Site web DiaspoMoney.fr et ses fonctionnalités techniques.</li>
                <li>Partie(s) : DiaspoMoney et l’Utilisateur concerné.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. ACCÈS À LA PLATEFORME
              </h2>
              <p className="text-gray-700 mb-4">
                L’accès à la plateforme est gratuit. Certaines fonctionnalités sont réservées aux
                utilisateurs inscrits. Toute utilisation vaut acceptation pleine et entière des
                présentes CGU.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. INSCRIPTION ET CRÉATION DE COMPTE
              </h2>
              <p className="text-gray-700 mb-4">
                L’inscription est obligatoire pour effectuer une commande. L’utilisateur doit fournir
                des informations exactes. La création de comptes multiples ou frauduleux est interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. RÔLE DE DIASPOMONEY
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney agit en qualité de tiers de confiance, mettant en relation le client et les
                prestataires, et supervise les opérations via ses intermédiaires. Elle fournit une
                plateforme sécurisée, conforme aux standards RGPD et LPM. DiaspoMoney n’est pas partie
                au contrat entre client et prestataire.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. COMPORTEMENT DES UTILISATEURS
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>Respecter les lois et règlements applicables</li>
                <li>Ne pas détourner la plateforme de son usage prévu</li>
                <li>Ne pas usurper d’identité ou accéder de manière frauduleuse</li>
                <li>Respecter la courtoisie et les bonnes pratiques de communication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. RESPONSABILITÉ
              </h2>
              <p className="text-gray-700 mb-4">
                Les prestataires sont seuls responsables de l’exécution de leurs prestations.
                DiaspoMoney n’a qu’une obligation de moyens pour leur sélection et supervision.
              </p>
              <p className="text-gray-700 mb-4">Elle ne peut être tenue responsable de :</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 mb-4">
                <li>La prestation exécutée par le prestataire</li>
                <li>L’absence de réponse du prestataire</li>
                <li>Les informations erronées communiquées par le client ou bénéficiaire</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. PROPRIÉTÉ INTELLECTUELLE
              </h2>
              <p className="text-gray-700 mb-4">
                Les éléments présents sur la plateforme (logos, textes, interfaces, etc.) sont protégés
                par le Code de la propriété intellectuelle. Toute reproduction ou exploitation non
                autorisée est interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. SUSPENSION / RÉSILIATION
              </h2>
              <p className="text-gray-700 mb-4">
                En cas de manquement, DiaspoMoney peut suspendre ou supprimer le compte utilisateur.
                Les CGU peuvent évoluer ; la version en vigueur est celle disponible en ligne au moment
                de la connexion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. DONNÉES PERSONNELLES & COOKIES
              </h2>
              <p className="text-gray-700 mb-4">
                La politique de confidentialité précise les traitements de données. L’utilisateur peut
                gérer ses préférences via le bandeau cookies ou son navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. DROIT APPLICABLE
              </h2>
              <p className="text-gray-700 mb-4">
                Les présentes CGU sont régies par le droit français. En cas de différend, les parties
                peuvent saisir le <strong>Centre de Médiation de la Consommation (CM2C)</strong>. À
                défaut d’accord, les tribunaux français seront compétents.
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

