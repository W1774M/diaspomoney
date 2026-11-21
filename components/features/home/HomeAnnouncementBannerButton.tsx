'use client';

export function HomeAnnouncementBannerButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event('diaspomoney:open-home-announcement'));
      }}
      className="underline underline-offset-2 hover:opacity-90 font-semibold"
    >
      voir l&apos;offre
    </button>
  );
}
