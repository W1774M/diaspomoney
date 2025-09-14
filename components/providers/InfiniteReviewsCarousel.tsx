// Ce composant doit être défini en dehors du composant principal
import { MOCK_REVIEWS } from "@/mocks";
import React from "react";

export function InfiniteReviewsCarousel() {
  // Utilise les avis mockés importés
  const reviews = MOCK_REVIEWS;
  // Pour la démo, on fait défiler les avis en boucle
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % reviews.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [reviews?.length]);
  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-gray-50 rounded-lg p-4 shadow w-full max-w-md">
        <p className="text-gray-800 italic mb-2">
          &quot;{reviews[index]?.text}&quot;
        </p>
        <p className="text-gray-600 text-right">- {reviews[index]?.author}</p>
      </div>
    </div>
  );
}
