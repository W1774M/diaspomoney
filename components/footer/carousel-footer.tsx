"use client";

import Image from "next/image";
import { useState } from "react";
import { COUNTRIES } from "@/lib/datas/countries";

const CarouselFooter = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? COUNTRIES.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === COUNTRIES.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="carousel flex transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {COUNTRIES.map((image, index) => (
          <div key={index} className="carousel-item flex-shrink-0 w-full">
            <Image
              src={image.src}
              alt={image.alt}
              width={100}
              height={50}
              className={`object-fit m-auto ${image.actived || 'grayscale'} `}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handlePrev}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
      >
        &#8249;
      </button>
      <button
        onClick={handleNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
      >
        &#8250;
      </button>
    </div>
  );
};

export default CarouselFooter;