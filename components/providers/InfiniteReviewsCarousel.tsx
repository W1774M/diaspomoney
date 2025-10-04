// Ce composant doit être défini en dehors du composant principal
import { getProviderReviews } from "@/mocks";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface InfiniteReviewsCarouselProps {
  providerId?: string;
}

export function InfiniteReviewsCarousel({
  providerId,
}: InfiniteReviewsCarouselProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (providerId) {
      const providerReviews = getProviderReviews(providerId);
      setReviews(providerReviews);
    } else {
      // Fallback vers des avis statiques si pas de providerId
      setReviews([
        {
          text: "Excellent service, très professionnel et à l'écoute. Je recommande vivement !",
          author: "Marie D.",
          rating: 5,
        },
        {
          text: "Très satisfait de la qualité du service et de la rapidité d'exécution.",
          author: "Jean P.",
          rating: 4,
        },
        {
          text: "Une équipe compétente et des résultats qui dépassent mes attentes.",
          author: "Sophie L.",
          rating: 5,
        },
        {
          text: "Service impeccable, je n'hésiterai pas à faire appel à eux à nouveau.",
          author: "Pierre M.",
          rating: 4,
        },
      ]);
    }
  }, [providerId]);

  useEffect(() => {
    if (reviews.length > 0) {
      const interval = setInterval(() => {
        setIndex(prev => (prev + 1) % reviews.length);
      }, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="bg-gray-50 rounded-lg p-4 shadow w-full max-w-md">
          <p className="text-gray-600 text-center">
            Aucun avis disponible pour le moment.
          </p>
        </div>
      </div>
    );
  }

  const currentReview = reviews[index];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-gray-50 rounded-lg p-4 shadow w-full max-w-md">
        {/* Affichage des étoiles */}
        <div className="flex items-center justify-center mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= (currentReview?.rating || 0)
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {currentReview?.rating}/5
          </span>
        </div>

        <p className="text-gray-800 italic mb-2">
          &quot;{currentReview?.text}&quot;
        </p>
        <p className="text-gray-600 text-right">- {currentReview?.author}</p>
      </div>
    </div>
  );
}
