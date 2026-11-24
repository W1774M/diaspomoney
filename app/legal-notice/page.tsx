import { Metadata } from 'next';
import Link from 'next/link';

import {
  DATA_PROTECTION_CONTACT,
  HOSTING_PROVIDER,
  LEGAL_ENTITY,
  formatLegalAddress,
} from '@/lib/legal/company';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/legal-notice',
  title: 'Mentions légales',
  description: 'Mentions légales de DiaspoMoney : éditeur, directeur de la publication, hébergeur et contact.',
});

const sectionTitle = 'text-2xl font-semibold text-gray-900 mb-4';
const text = 'text-gray-700 mb-2';
const link = 'text-brand-700 hover:underline';

export default function LegalNoticePage() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mentions légales</h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className={sectionTitle}>Éditeur du site</h2>
              <p className={text}>
                Le site <strong>diaspomoney.fr</strong> est édité par <strong>{LEGAL_ENTITY.name}</strong>,{' '}
                {LEGAL_ENTITY.legalForm}.
              </p>
              <ul className="list-disc space-y-1 pl-6 text-gray-700 mb-4">
                <li>Siège social : {formatLegalAddress()}</li>
                <li>SIREN : {LEGAL_ENTITY.siren}</li>
                <li>SIRET du siège : {LEGAL_ENTITY.siret}</li>
                <li>
                  N° de TVA intracommunautaire :{' '}
                  {LEGAL_ENTITY.vatNumber ?? 'non attribué'}
                </li>
                <li>
                  E-mail :{' '}
                  <a href={`mailto:${LEGAL_ENTITY.email}`} className={link}>
                    {LEGAL_ENTITY.email}
                  </a>
                </li>
              </ul>
              <p className={text}>
                Le site est exploité pour le compte de la société {LEGAL_ENTITY.successor}.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={sectionTitle}>Directeur de la publication</h2>
              <p className={text}>{LEGAL_ENTITY.publicationDirector}</p>
            </section>

            <section className="mb-8">
              <h2 className={sectionTitle}>Hébergeur</h2>
              <p className={text}>
                <strong>{HOSTING_PROVIDER.name}</strong>, {HOSTING_PROVIDER.address}
              </p>
              <p className={text}>
                {HOSTING_PROVIDER.registration} – Tél. : {HOSTING_PROVIDER.phone} –{' '}
                <a href={HOSTING_PROVIDER.website} className={link} rel="noopener noreferrer">
                  {HOSTING_PROVIDER.website.replace('https://', '')}
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className={sectionTitle}>Données personnelles</h2>
              <p className={text}>
                Le traitement des données personnelles est décrit dans la{' '}
                <Link href="/privacy-policy" className={link}>
                  politique de confidentialité
                </Link>
                . Aucun délégué à la protection des données (DPO) n’est désigné à ce jour ; pour
                exercer vos droits, écrivez à{' '}
                <a href={`mailto:${DATA_PROTECTION_CONTACT.email}`} className={link}>
                  {DATA_PROTECTION_CONTACT.email}
                </a>{' '}
                (objet : « {DATA_PROTECTION_CONTACT.subject} »).
              </p>
            </section>

            <section className="mb-8">
              <h2 className={sectionTitle}>Conditions d’utilisation et de vente</h2>
              <p className={text}>
                Voir les{' '}
                <Link href="/terms-and-conditions" className={link}>
                  conditions générales d’utilisation
                </Link>{' '}
                et les{' '}
                <Link href="/terms-of-sale" className={link}>
                  conditions générales de vente
                </Link>
                .
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link href="/" className="text-brand-700 hover:underline font-medium">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
