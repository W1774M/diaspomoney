// Ce composant doit être défini en dehors du composant principal
import React, { useState, useEffect } from "react";

// Avis statiques pour la démonstration (en attendant l'implémentation de l'API des avis)
const STATIC_REVIEWS = [
  {
    text: "Excellent service, très professionnel et à l'écoute. Je recommande vivement !",
    author: "Marie D."
  },
  {
    text: "Très satisfait de la qualité du service et de la rapidité d'exécution.",
    author: "Jean P."
  },
  {
    text: "Une équipe compétente et des résultats qui dépassent mes attentes.",
    author: "Sophie L."
  },
  {
    text: "Service impeccable, je n'hésiterai pas à faire appel à eux à nouveau.",
    author: "Pierre M."
  }
];

export function InfiniteReviewsCarousel() {
  // Utilise les avis statiques
  const reviews = STATIC_REVIEWS;
  // Pour la démo, on fait défiler les avis en boucle
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % reviews.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [reviews.length]);
  
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
