import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { ManageCookiesButton } from '@/components/consent/CookieConsent';

// Facebook icon component (replacement for deprecated lucide-react Facebook)
const FacebookIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Instagram icon component (replacement for deprecated lucide-react Instagram)
const InstagramIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
  </svg>
);

// LinkedIn icon component (replacement for deprecated lucide-react Linkedin)
const LinkedinIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

type FooterLink = { href: string; text: string };

const linkClass =
  'text-sm text-stone-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline';

const FooterLinks = ({ links, label }: { links: FooterLink[]; label: string }) => (
  <nav aria-label={label}>
    {/* h2 : le pied de page suit le contenu, pas de saut de niveau */}
    <h2 className='mb-4 text-base font-bold text-stone-900'>{label}</h2>
    <ul className='space-y-2.5' role='list'>
      {links.map(link => (
        <li key={link.href}>
          <Link href={link.href} className={linkClass}>
            {link.text}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

const SOCIAL = [
  { href: 'https://www.facebook.com/profile.php?id=61586670864659', label: 'Facebook', Icon: FacebookIcon },
  { href: 'https://www.instagram.com/diaspomoney.fr/', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://www.linkedin.com/company/diaspomoney', label: 'LinkedIn', Icon: LinkedinIcon },
] as const;

const FooterComponent = ({ className = '' }: { className?: string }) => {
  const year = new Date().getFullYear();
  return (
    <footer className={`bg-[#FDF8F3] font-display ${className}`}>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12'>
          <div>
            <Logo
              src='/img/diaspo/Logo_DispoMoney_horiz.webp'
              width={640}
              height={224}
              alt='DiaspoMoney'
              className='mb-4 h-16 w-auto'
            />
            <p className='mb-6 max-w-xs text-sm leading-relaxed text-stone-600'>
              La plateforme qui permet à la diaspora africaine de prendre soin de ses proches en
              payant directement leurs services de santé.
            </p>
            <ul className='flex gap-2' role='list' aria-label='Réseaux sociaux'>
              {SOCIAL.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex size-11 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition-colors hover:border-brand-600 hover:text-brand-700'
                  >
                    <Icon size={18} />
                    <span className='visually-hidden'>{label} (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterLinks
            label='Services'
            links={[
              { href: '/services/health', text: 'Santé' },
              { href: '/services/edu', text: 'Éducation' },
              { href: '/services/immo', text: 'Immobilier' },
            ]}
          />

          <FooterLinks
            label='Entreprise'
            links={[
              { href: '/about', text: 'À propos' },
              { href: '/support', text: 'Aide et contact' },
            ]}
          />

          <div>
            <h2 className='mb-4 text-base font-bold text-stone-900'>Contact</h2>
            <address className='space-y-3 not-italic'>
              <p className='flex items-center gap-3'>
                <Mail aria-hidden='true' className='size-[18px] shrink-0 text-brand-600' />
                <a href='mailto:contact@diaspomoney.fr' className={linkClass}>
                  contact@diaspomoney.fr
                </a>
              </p>
              <p className='flex items-start gap-3 text-sm text-stone-600'>
                <MapPin aria-hidden='true' className='mt-0.5 size-[18px] shrink-0 text-brand-600' />
                Seine Innopolis, 76140 Le Petit-Quevilly, France
              </p>
            </address>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t border-stone-200 py-8 md:flex-row'>
          <p className='text-center text-sm text-stone-600 md:text-start'>
            © {year} DiaspoMoney. Tous droits réservés.
          </p>
          <nav aria-label='Informations légales'>
            <ul className='flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-end' role='list'>
              <li>
                <Link href='/legal-notice' className={linkClass}>
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href='/terms-and-conditions' className={linkClass}>
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link href='/terms-of-sale' className={linkClass}>
                  Conditions générales de vente
                </Link>
              </li>
              <li>
                <Link href='/privacy-policy' className={linkClass}>
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <ManageCookiesButton className={linkClass} />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};
export default FooterComponent;
