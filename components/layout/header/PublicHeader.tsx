'use client';

import Logo from '@/components/ui/Logo';
import { useDisclosure } from '@/hooks/_shared/useDisclosure';
import { useAuth } from '@/hooks/auth/useAuth';
import { ChevronDown, Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'Comment ça marche' },
  { href: '/#services', label: 'Nos services' },
  { href: '/#testimonials', label: 'Témoignages' },
  { href: '/#partners', label: 'Partenaires' },
] as const;

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:text-brand-400 aria-[current=page]:text-brand-400 aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8';

const menuItemClass =
  'block w-full rounded-md px-3 py-2.5 text-start text-sm text-white hover:bg-white/10 hover:text-brand-400';

export default function PublicHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const mobile = useDisclosure();
  const account = useDisclosure();

  const headerRef = useRef<HTMLElement>(null);

  // Masque la barre en défilant vers le bas, la ramène dès qu'on remonte
  useEffect(() => {
    const bar = headerRef.current;
    if (!bar) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      // borné : le rebond élastique en haut/bas ne doit pas inverser le sens
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      if (y === lastY) return;
      bar.classList.toggle('is-hidden', y > lastY && y > bar.offsetHeight);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = () => {
    account.close();
    mobile.close();
    signOut();
  };

  return (
    // Barre unique, compacte (64 px) et collante ; masquée en défilant vers le bas
    <header ref={headerRef} className='site-top-bar sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80'>
      <div
        ref={mobile.containerRef}
        className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'
      >
        <Link
          href='/'
          className='flex shrink-0 items-center rounded-md'
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <Logo
            loading='eager'
            src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
            width={640}
            height={320}
            alt='DiaspoMoney, accueil'
            className='h-12 w-auto'
          />
        </Link>

        <nav aria-label='Principale' className='hidden md:block'>
          <ul className='flex items-center gap-1' role='list'>
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='flex items-center gap-2'>
          {user ? (
            <div ref={account.containerRef} className='relative hidden md:block'>
              <button
                {...account.triggerProps}
                className='flex min-h-11 items-center gap-2 rounded-full py-1 pe-3 ps-1 text-sm font-medium text-white hover:bg-white/10'
              >
                <span className='flex size-8 items-center justify-center rounded-full bg-brand-600'>
                  <User aria-hidden='true' className='size-4' />
                </span>
                <span className='max-w-40 truncate'>{user.name || 'Mon compte'}</span>
                <ChevronDown
                  aria-hidden='true'
                  className={`size-4 transition-transform ${account.open ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                {...account.panelProps}
                hidden={!account.open}
                className='absolute end-0 mt-2 w-56 rounded-xl border border-white/10 bg-stone-900 p-1.5 shadow-xl'
              >
                <Link href='/dashboard' className={menuItemClass} onClick={() => account.close()}>
                  Tableau de bord
                </Link>
                <Link
                  href='/dashboard/settings'
                  className={menuItemClass}
                  onClick={() => account.close()}
                >
                  Paramètres
                </Link>
                <hr className='my-1 border-white/10' />
                <button type='button' onClick={handleSignOut} className={menuItemClass}>
                  Se déconnecter
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href='/login'
                className='hidden min-h-11 items-center rounded-md px-3 text-sm font-medium text-white hover:bg-white/10 hover:text-brand-400 md:inline-flex'
              >
                Se connecter
              </Link>
              <Link
                href='/#services'
                className='hidden min-h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 md:inline-flex'
              >
                Commencer
              </Link>
            </>
          )}

          <button
            {...mobile.triggerProps}
            className='inline-flex size-11 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden'
          >
            {mobile.open ? (
              <X aria-hidden='true' className='size-6' />
            ) : (
              <Menu aria-hidden='true' className='size-6' />
            )}
            <span className='visually-hidden'>Menu</span>
          </button>
        </div>

        {/* Navigation mobile : même liste, panneau sous la barre */}
        <nav
          {...mobile.panelProps}
          aria-label='Principale (mobile)'
          hidden={!mobile.open}
          className='absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-stone-950 px-4 pb-6 pt-2 md:hidden'
        >
          <ul className='flex flex-col gap-1' role='list'>
            <li>
              <Link
                href='/'
                className={`${menuItemClass} text-base`}
                aria-current={pathname === '/' ? 'page' : undefined}
                onClick={() => mobile.close()}
              >
                Accueil
              </Link>
            </li>
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} className={`${menuItemClass} text-base`} onClick={() => mobile.close()}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className='mt-4 flex flex-col gap-2 border-t border-white/10 pt-4'>
            {user ? (
              <>
                <Link href='/dashboard' className={`${menuItemClass} text-base`} onClick={() => mobile.close()}>
                  Tableau de bord
                </Link>
                <button type='button' onClick={handleSignOut} className={`${menuItemClass} text-base`}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link href='/login' className={`${menuItemClass} text-base`} onClick={() => mobile.close()}>
                  Se connecter
                </Link>
                <Link
                  href='/#services'
                  className='flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-5 text-base font-semibold text-white hover:bg-brand-700'
                  onClick={() => mobile.close()}
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
