import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - DiaspoMoney',
  description: 'Politique de confidentialité de DiaspoMoney',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Politique de confidentialité
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Collecte des informations
              </h2>
              <p className="text-gray-700 mb-4">
                DiaspoMoney collecte des informations lorsque vous vous inscrivez sur notre site,
                passez une commande, vous abonnez à notre newsletter ou remplissez un formulaire.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Utilisation des informations
              </h2>
              <p className="text-gray-700 mb-4">
                Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
                <li>Fournir un contenu publicitaire personnalisé</li>
                <li>Améliorer notre site web</li>
                <li>Améliorer le service client et vos besoins de prise en charge</li>
                <li>Vous contacter par e-mail</li>
                <li>Administrer un concours, une promotion, ou une enquête</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Confidentialité du commerce en ligne
              </h2>
              <p className="text-gray-700 mb-4">
                Nous sommes les seuls propriétaires des informations recueillies sur ce site.
                Vos informations personnelles ne seront pas vendues, échangées, transférées,
                ou données à une autre société pour n&apos;importe quelle raison, sans votre consentement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Consentement
              </h2>
              <p className="text-gray-700 mb-4">
                En utilisant notre site, vous consentez à notre politique de confidentialité.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Si vous avez des questions concernant cette politique de confidentialité,
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

