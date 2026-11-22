'use client';

export const OPEN_HOME_ANNOUNCEMENT_EVENT = 'diaspomoney:open-home-announcement';

export function HomeAnnouncementBannerButton({ label = "voir l'offre" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_HOME_ANNOUNCEMENT_EVENT));
      }}
      aria-haspopup="dialog"
      className="underline underline-offset-2 hover:opacity-90 font-semibold"
    >
      {label}
    </button>
  );
}
