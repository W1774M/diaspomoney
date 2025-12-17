import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation - DiaspoMoney',
  description: 'Conditions générales d\'utilisation de DiaspoMoney',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Conditions générales d&apos;utilisation
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptation des conditions
              </h2>
              <p className="text-gray-700 mb-4">
                En accédant et en utilisant le site web DiaspoMoney, vous acceptez d&apos;être lié
                par les présentes conditions générales d&apos;utilisation. Si vous n&apos;acceptez pas
                ces conditions, veuillez ne pas utiliser notre site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Utilisation du site
              </h2>
              <p className="text-gray-700 mb-4">
                Vous vous engagez à utiliser DiaspoMoney uniquement à des fins légales et de manière
                qui ne viole pas les droits d&apos;autrui ou ne restreint pas l&apos;utilisation et la
                jouissance du site par d&apos;autres utilisateurs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Réservations et paiements
              </h2>
              <p className="text-gray-700 mb-4">
                Les réservations effectuées sur DiaspoMoney sont soumises à disponibilité et à
                confirmation. Les prix sont indiqués en euros et peuvent être modifiés à tout moment.
                Les paiements sont traités de manière sécurisée.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Annulations et remboursements
              </h2>
              <p className="text-gray-700 mb-4">
                Les conditions d&apos;annulation et de remboursement varient selon le type de service
                réservé. Veuillez consulter les conditions spécifiques lors de votre réservation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Propriété intellectuelle
              </h2>
              <p className="text-gray-700 mb-4">
                Tout le contenu présent sur DiaspoMoney, y compris les textes, graphiques, logos,
                icônes, images et logiciels, est la propriété de DiaspoMoney ou de ses fournisseurs
                de contenu et est protégé par les lois sur la propriété intellectuelle.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Limitation de responsabilité
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney ne pourra être tenu responsable des dommages directs ou indirects résultant
                de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le site ou les services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant ces conditions générales d&apos;utilisation,
                vous pouvez nous contacter à{' '}
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

