import { getAssetURL } from '@/config/cdn';
import Image from 'next/image';
import Link from 'next/link';
// import CarouselFooter from "./carousel-footer";

const FooterLinks = ({
  links,
  label,
}: {
  links: { href: string; text: string; target?: string; rel?: string }[];
  label?: string;
}) => {
  return (
    <div className='flex flex-col'>
      <h4 className='text-base font-bold mb-4 text-[hsl(25,100%,53%)] tracking-wide'>
        {label}
      </h4>
      <ul className='space-y-2.5'>
        {links.map((link, index) => (
          <li key={`footer-link-${index}`}>
            <Link
              href={link.href}
              className='text-gray-300 hover:text-white transition-colors duration-200 text-sm'
              target={link?.target}
              rel={link?.rel}
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FooterComponent = ({ className = '' }: { className?: string }) => {
  return (
    <footer className={`bg-black text-white ${className}`}>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section principale */}
        <div className='py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
          {/* Logo et description */}
          <div className='lg:col-span-1'>
            <div className='mb-4'>
              <Image
                width={200}
                height={70}
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                alt='DiaspoMoney logo'
                className='h-auto w-auto max-w-[200px]'
                loader={({ src, width, quality }) =>
                  getAssetURL(src, { width, quality: quality ?? 85 })
                }
              />
            </div>
            <p className='text-gray-300 text-sm leading-relaxed mt-4 max-w-xs'>
              Transférez des services, pas de l'argent, pour une économie
              durable.
            </p>
          </div>

          <FooterLinks
            label='Services'
            links={[
              {
                href: '/services/health',
                text: 'Santé',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              {
                href: '/services/edu',
                text: 'Éducation',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              {
                href: '/services/immo',
                text: 'Immobilier & BTP',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            ]}
          />

          <FooterLinks
            label='À propos'
            links={[
              {
                href: 'https://diaspomoney.fr/about/',
                text: 'Notre équipe',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              { href: '/#how-it-works', text: 'Comment ça marche' },
            ]}
          />

          <FooterLinks
            label='Contact'
            links={[
              {
                href: '/support',
                text: 'Centre de support',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              {
                href: '/hotline',
                text: 'Hotline',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              {
                href: 'mailto:support@diaspomoney.fr',
                text: 'Email support',
              },
              { href: '#', text: 'FAQ' },
            ]}
          />
        </div>

        {/* Section secondaire */}
        <div className='border-t border-gray-800 pt-8 pb-8 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12'>
          {/* Localisation */}
          <div className='flex flex-col'>
            <h4 className='text-base font-bold mb-4 text-[hsl(25,100%,53%)] uppercase tracking-wide'>
              Localisation
            </h4>
            <div className='mb-3'>
              <Image
                width={120}
                height={70}
                src='/img/diaspo/map_of_france_1-Converti-1536x1087.png'
                alt='Carte de France'
                className='h-auto w-auto max-w-[120px]'
                loader={({ src, width, quality }) =>
                  getAssetURL(src, { width, quality: quality ?? 85 })
                }
              />
            </div>
            <div className='space-y-1 text-sm text-gray-300'>
              <p className='font-semibold text-white'>Seine Innopolis</p>
              <p>72 Rue de la République</p>
              <p>76140, Le Petit-Quevilly</p>
            </div>
          </div>

          {/* Mentions légales */}
          <FooterLinks
            label='Mentions légales'
            links={[
              {
                href: '/terms-and-conditions',
                text: 'CGU & CGV',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              {
                href: '/privacy-policy',
                text: 'Politique de confidentialité',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            ]}
          />

          {/* CTA Prestataire */}
          <div className='flex flex-col'>
            <h4 className='text-base font-bold mb-4 text-[hsl(25,100%,53%)] uppercase tracking-wide'>
              Devenez prestataire DiaspoMoney
            </h4>
            <div className='mt-2'>
              <Link
                href='https://calendly.com/tnpriso/presentation-de-plateforme-diaspomoney-fr?month=2025-08'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-block text-center text-white font-bold uppercase bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)] px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl'
              >
                Nous Contacter
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className='border-t border-gray-800 pt-6 pb-8'>
          <p className='text-gray-400 text-xs text-center md:text-left'>
            © 2025 DiaspoMoney. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default FooterComponent;
