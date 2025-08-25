"use client";

import { COUNTRIES } from "@/lib/datas/countries";
import Image from "next/image";
import { useState } from "react";

const VISIBLE_COUNT = 3; // On veut voir 2 images à la fois

const CarouselFooter = () => {
  // On commence à 2 pour être sur les vraies images (visibles)
  const [currentIndex, setCurrentIndex] = useState(VISIBLE_COUNT);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // On duplique les deux dernières + deux premières pour triche visuelle infini
  const images = [
    ...COUNTRIES.slice(-VISIBLE_COUNT), // copies des dernières au début
    ...COUNTRIES,
    ...COUNTRIES.slice(0, VISIBLE_COUNT), // copies des premières à la fin
  ];

  const TOTAL = COUNTRIES.length;

  const handlePrev = () => {
    if (!isTransitioning) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      setIsTransitioning(true);
    }
  };

  const handleNext = () => {
    if (!isTransitioning) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setIsTransitioning(true);
    }
  };

  // Gérer le bouclage “infini” pour 2 visibles
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    // Au tout début (copies), reset à la vraie dernière slide visible
    if (currentIndex === 0) {
      setCurrentIndex(TOTAL);
    }
    // À la toute fin (copies), reset à la vraie première slide visible
    else if (currentIndex === images.length - VISIBLE_COUNT) {
      setCurrentIndex(VISIBLE_COUNT);
    }
  };

  return (
    <div className="relative w-full px-10 overflow-hidden">
      <div
        className={`carousel flex items-center transition-transform duration-500 ${
          isTransitioning ? "" : "transition-none"
        }`}
        style={{
          width: `${(images.length * 100) / VISIBLE_COUNT}%`,
          transform: `translateX(-${(currentIndex * 100) / images.length}%)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {images.map((image, index) => (
          <div
            key={`carousel-img-${index}`}
            className=""
            style={{
              flex: `0 0 ${100 / images.length}%`,
              maxWidth: `${100 / images.length}%`,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={50}
              height={25}
              className={`object-fit m-auto ${image.actived || "grayscale"} `}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 text-4xl text-white font-extrabold cursor-pointer p-2 rounded-full z-10"
      >
        &#8249;
      </button>
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-4xl text-white font-extrabold cursor-pointer p-2 rounded-full z-10"
      >
        &#8250;
      </button>
    </div>
  );
};

export default CarouselFooter;
