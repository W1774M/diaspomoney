import Link from 'next/link';
import { Marquee } from '@/components/ui/Marquee';
import { isExternalHref, type HomeBannerMessage } from '@/lib/home-content';
import { HomeAnnouncementBannerButton } from './HomeAnnouncementBannerButton';

const linkClass = 'underline underline-offset-2 hover:opacity-90 font-semibold';

/** Contenu d'un message (réutilisé pour l'aperçu dans l'admin). */
export function BannerMessageContent({
  message,
  preview = false,
}: {
  message: HomeBannerMessage;
  /** Aperçu admin : liens non cliquables. */
  preview?: boolean;
}) {
  const { icon, textBefore, linkType, linkLabel, linkHref, textAfter } = message;

  let link: React.ReactNode = null;
  if (linkType !== 'none' && linkLabel) {
    if (preview) {
      link = <span className={linkClass}>{linkLabel}</span>;
    } else if (linkType === 'announcement') {
      link = <HomeAnnouncementBannerButton label={linkLabel} />;
    } else if (linkHref && isExternalHref(linkHref)) {
      link = (
        <a href={linkHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {linkLabel}
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
      );
    } else if (linkHref) {
      link = (
        <Link href={linkHref} className={linkClass}>
          {linkLabel}
        </Link>
      );
    }
  }

  // Pas d'espace avant une ponctuation qui suit le lien (« devis. »).
  const glueAfter = /^[.,;:!?)…]/.test(textAfter);

  return (
    <span className="inline-flex items-center gap-1">
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {textBefore ? <span>{textBefore}</span> : null}
      {link}
      {textAfter ? <span className={glueAfter ? '-ml-1' : undefined}>{textAfter}</span> : null}
    </span>
  );
}

export function HomeBanner({ messages }: { messages: HomeBannerMessage[] }) {
  if (messages.length === 0) return null;

  return (
    <Marquee
      label="Annonces DiaspoMoney"
      className="w-full bg-brand-600 text-white py-3 pr-10 text-sm font-medium"
      trackClassName="whitespace-nowrap"
      controlClassName="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-1 text-white hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      {messages.map((message) => (
        <span key={message.id} className="inline-flex items-center gap-1 mx-8">
          <BannerMessageContent message={message} />
          <span className="text-white/70 mx-2" aria-hidden>
            •
          </span>
        </span>
      ))}
    </Marquee>
  );
}
