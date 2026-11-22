'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { MapPin, Stethoscope, X } from 'lucide-react';
import { HEALTH_CLINICS, type ClinicOption } from '@/lib/clinics';
import { inCountryLabel } from '@/lib/presence-countries';
import { Marquee } from '@/components/ui/Marquee';
import { NativeModal } from '@/components/ui/NativeModal';
import { CLINICS_SECTION_ID, useHomeCountryFilter } from './HomeCountryFilter';

function ClinicPrices({ clinic }: { clinic: ClinicOption }) {
  return (
    <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm">
      {clinic.generalistPrice ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">Médecin généraliste</span>
          <span className="font-bold text-gray-900">
            Médecin généraliste : {clinic.generalistPrice}
          </span>
        </div>
      ) : null}
      {clinic.specialistPrice ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">Médecin spécialiste</span>
          <span className="font-bold text-gray-900">
            Médecin spécialiste : {clinic.specialistPrice}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ClinicsCarouselSection() {
  const router = useRouter();
  const [selectedClinic, setSelectedClinic] = useState<ClinicOption | null>(null);
  const { countries, country, setCountry } = useHomeCountryFilter();
  const selectedCountry = country ? countries.find((c) => c.iso === country) : undefined;
  const countryInfo = selectedCountry ? { inCountry: inCountryLabel(selectedCountry) } : undefined;
  const clinics = useMemo(
    () => (country ? HEALTH_CLINICS.filter((clinic) => clinic.country === country) : HEALTH_CLINICS),
    [country],
  );

  const handleChooseClinic = (clinic: ClinicOption) => {
    window.localStorage.setItem('diaspomoney.selectedClinic', JSON.stringify(clinic));
    router.push(`/services/health?clinic=${encodeURIComponent(clinic.id)}`);
  };

  return (
    <section
      id={CLINICS_SECTION_ID}
      className="scroll-mt-4 py-16 md:py-20 bg-gradient-to-b from-white to-orange-50/40 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-6">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm font-medium"
            style={{
              backgroundColor: '#F97015',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {countryInfo ? `Santé ${countryInfo.inCountry}` : 'Santé à Douala'}
          </span>
        </div>

        <div className="text-center mb-10">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#1C1917',
            }}
          >
            Cliniques partenaires
          </h2>
          <p
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Des établissements de santé disponibles à Douala pour accompagner vos proches, avec des
            tarifs de consultation clairs.
          </p>

          {countryInfo ? (
            <p
              className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-sm text-gray-700"
              role="status"
            >
              <span>
                {clinics.length} clinique{clinics.length > 1 ? 's' : ''} disponible
                {clinics.length > 1 ? 's' : ''} {countryInfo.inCountry}
              </span>
              <button
                type="button"
                onClick={() => setCountry(null)}
                className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-white px-3 py-1 font-medium text-[hsl(25,100%,40%)] hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(25,100%,45%)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Voir tous les pays
              </button>
            </p>
          ) : null}
        </div>

        {clinics.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Aucune clinique disponible {countryInfo?.inCountry ?? ''} pour le moment
            </h3>
            <p className="text-gray-600">
              Nos cliniques partenaires {countryInfo?.inCountry ?? ''} arrivent bientôt.
            </p>
          </div>
        ) : (
        <Marquee
          // Remonte le défilement au changement de pays.
          key={country ?? 'all'}
          label={countryInfo ? `Cliniques partenaires ${countryInfo.inCountry}` : 'Cliniques partenaires'}
          trackClassName="gap-6 py-2"
          controlClassName="absolute right-3 top-4 z-10 rounded-full border border-orange-200 bg-white p-1.5 text-[hsl(25,100%,40%)] shadow-sm hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(25,100%,45%)]"
        >
            {clinics.map((clinic) => (
              <article
                key={clinic.name}
                className="relative flex h-[450px] w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white text-left shadow-sm transition-shadow hover:shadow-lg motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 md:h-[470px] md:w-[380px] focus-within:ring-2 focus-within:ring-[hsl(25,100%,45%)]"
              >
                <div className="relative h-44 w-full bg-orange-50">
                  <Image
                    src={clinic.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 320px, 380px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[hsl(25,100%,45%)] shadow-sm">
                    Santé
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {/* Le bouton s’étend à toute la carte via ::after (carte entièrement cliquable). */}
                        <button
                          type="button"
                          onClick={() => setSelectedClinic(clinic)}
                          aria-haspopup="dialog"
                          className="text-left after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none"
                        >
                          {clinic.name}
                        </button>
                      </h3>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[hsl(25,100%,53%)]">
                        <MapPin className="h-4 w-4" aria-hidden />
                        {clinic.location}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 min-h-0 flex-1 overflow-y-auto pr-1">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Spécialités
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </article>
            ))}
        </Marquee>
        )}
      </div>

      <NativeModal
        open={selectedClinic !== null}
        onClose={() => setSelectedClinic(null)}
        labelledBy="clinic-detail-title"
        className="max-w-2xl rounded-2xl shadow-2xl"
      >
        {selectedClinic ? (
          <div>
            <div className="relative h-64 w-full bg-orange-50">
              <Image
                src={selectedClinic.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedClinic(null)}
                className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm hover:bg-white"
                aria-label="Fermer le détail de la clinique"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
                  <Stethoscope className="h-4 w-4" aria-hidden />
                  Clinique partenaire
                </p>
                <h3 id="clinic-detail-title" className="text-2xl font-bold">
                  {selectedClinic.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {selectedClinic.location}
                </p>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Toutes les spécialités
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClinic.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-[hsl(25,100%,40%)]"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <ClinicPrices clinic={selectedClinic} />

              <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedClinic(null)}
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => handleChooseClinic(selectedClinic)}
                  className="rounded-lg bg-[hsl(25,100%,53%)] px-5 py-3 font-semibold text-white hover:bg-[hsl(25,100%,48%)]"
                >
                  Choisir cette clinique
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </NativeModal>
    </section>
  );
}
