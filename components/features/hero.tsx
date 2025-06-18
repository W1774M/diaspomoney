"use client";
import { heroData } from "@/lib/datas/hero";
import { useEffect, useState } from "react";

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at the first "real" item
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  useEffect(() => {
    if (currentIndex === 0) {
      // Jump to the last "real" item without animation
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(heroData.length);
      }, 500); // Match the transition duration
      return () => clearTimeout(timeout);
    } else if (currentIndex === heroData.length + 1) {
      // Jump to the first "real" item without animation
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 500); // Match the transition duration
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setIsTransitioning(false), 500); // Match the transition duration
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const extendedItems = [heroData[heroData.length - 1], ...heroData, heroData[0]];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className={`flex w-full transition-transform duration-500 ${
          isTransitioning ? "" : "duration-0"
        }`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {extendedItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center justify-center w-full min-w-[300px] h-[400px] bg-gray-200 mx-2"
          >
            <div className="flex flex-row items-center w-full h-full">
              <div style={{backgroundImage: `url('${item.imageUrl}')`, backgroundSize: "cover", backgroundRepeat: "no-repeat", overflow: "hidden"}} className="w-1/2 h-full"></div>
              <div className={`w-1/2 h-full bg-[${item.bgColor}] flex items-center justify-center p-4`}>
                <p className="text-lg font-bold">Text for Item {item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2 rounded-full cursor-pointer"
      >
        Prev
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2 rounded-full cursor-pointer"
      >
        Next
      </button>
    </div>
  );
};

export default Hero;
