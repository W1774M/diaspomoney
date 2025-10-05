"use client";

import ExternalImage from "@/components/common/ExternalImage";
import { MOCK_PARTNERS } from "@/mocks";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: string;
  services: string[];
  location: string;
  established: string;
}

interface PartnerModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
}

const PartnerModal = ({ partner, isOpen, onClose }: PartnerModalProps) => {
  if (!partner || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b">
          <button
            title="Fermer"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            <ExternalImage
              src={partner.logo}
              alt={partner.name}
              className="w-16 h-16 object-contain rounded-lg"
              width={64}
              height={64}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {partner.name}
              </h2>
              <p className="text-gray-600">{partner.category}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-700">{partner.description}</p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {partner.services.map((service, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Localisation</h4>
              <p className="text-gray-600">{partner.location}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Établi en</h4>
              <p className="text-gray-600">{partner.established}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t">
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-[hsl(25,100%,53%)] text-white font-semibold rounded-lg hover:bg-[hsl(25,100%,45%)] transition-colors"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Visiter le site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export function InfiniteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [disableTransition, setDisableTransition] = useState(false);
  const [hoveredPartnerId, setHoveredPartnerId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Données des partenaires
  const partners: Partner[] = (MOCK_PARTNERS as unknown as Partner[]) || [];

  // Stratégie d'infinite loop sans recul: on place l'index au milieu d'une piste triplée
  const track: Partner[] = [...partners, ...partners, ...partners];
  const baseLength = partners.length;
  const startIndex = baseLength; // début au milieu

  // Initialiser l'index au milieu au premier rendu
  useEffect(() => {
    if (baseLength > 0) setCurrentIndex(startIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLength]);

  // Largeur d'un item (1/5 de la largeur du conteneur)
  const itemWidthPct = 100 / 5;

  useEffect(() => {
    if (hoveredPartnerId || baseLength === 0) return;

    const interval = setInterval(() => {
      setDisableTransition(false);
      setCurrentIndex(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [hoveredPartnerId, baseLength]);

  // Gérer la fin de transition pour recaler l'index au milieu sans animation
  const handleTransitionEnd = () => {
    if (currentIndex >= startIndex + baseLength) {
      setDisableTransition(true);
      setCurrentIndex(startIndex);
    } else if (currentIndex <= startIndex - 1) {
      setDisableTransition(true);
      setCurrentIndex(startIndex + baseLength - 1);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPartner(null);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <div
          ref={carouselRef}
          className={`flex ${
            disableTransition
              ? "transition-none"
              : "transition-transform duration-1000 ease-in-out"
          }`}
          style={{
            transform: `translateX(-${currentIndex * itemWidthPct}%)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {track.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="w-1/5 flex-shrink-0 px-4"
            >
              <div
                className={`relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                  hoveredPartnerId === partner.id
                    ? "scale-105 shadow-2xl"
                    : "hover:scale-105"
                }`}
                onMouseEnter={() => setHoveredPartnerId(partner.id)}
                onMouseLeave={() => setHoveredPartnerId(null)}
                onClick={() => handlePartnerClick(partner)}
              >
                {/* Overlay sombre au hover */}
                <div
                  className={`absolute inset-0 bg-black transition-opacity duration-300 z-10 ${
                    hoveredPartnerId === partner.id ? "opacity-30" : "opacity-0"
                  }`}
                />

                {/* Image du partenaire */}
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <span className="text-2xl font-bold text-[hsl(25,100%,53%)]">
                        {partner.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-gray-600">{partner.category}</p>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {partner.category}
                  </p>
                </div>

                {/* Bouton d'action visible au hover */}
                <div
                  className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
                    hoveredPartnerId === partner.id
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  <button className="bg-white text-[hsl(25,100%,53%)] px-4 py-2 rounded-full text-xs font-semibold shadow-lg hover:bg-gray-50 transition-colors">
                    Voir détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicateurs de position */}
        <div className="flex justify-center mt-6 space-x-2">
          {partners.map((_, index) => (
            <button
              title="Indicateur de position"
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === (currentIndex - startIndex + baseLength) % baseLength
                  ? "bg-[hsl(25,100%,53%)]"
                  : "bg-gray-300"
              }`}
              onClick={() => {
                setDisableTransition(false);
                setCurrentIndex(startIndex + index);
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal des détails du partenaire */}
      <PartnerModal
        partner={selectedPartner}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
