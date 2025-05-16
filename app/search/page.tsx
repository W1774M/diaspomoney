
"use client"
import { providers } from "@/lib/datas/providers";
import DefaultTemplate from "@/template/DefaultTemplate";
import {
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Star,
} from 'lucide-react';
import Image from "next/image";
import { useEffect, useState } from "react";

// Composant de page de recherche de prestataire
export default function SearchPage() {
  const [founded, setFounded] = useState<number>(0); 
  const [filters, setFilters] = useState({
    specialty: '',
    priceMin: 0,
    priceMax: 500,
    rating: 0,
    location: ''
  });

  useEffect(() => {
    const count = providers.length;
    setFounded(count)
  }, [])


  return (
    <DefaultTemplate>
    <div className="flex flex-col">
      {/* Barre de recherche principale */}
      <div className="bg-blue-600 py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option>Consultation médicale générale</option>
                    <option>Consultation spécialiste</option>
                    <option>Analyses médicales</option>
                    <option>Imagerie médicale</option>
                    <option>Hospitalisation</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option>Douala</option>
                    <option>Yaoundé</option>
                    <option>Bafoussam</option>
                    <option>Garoua</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option>Tous les quartiers</option>
                    <option>Akwa</option>
                    <option>Bonanjo</option>
                    <option>Bonapriso</option>
                    <option>Makepe</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <button className="bg-blue-600 text-white rounded-md px-6 py-2 font-medium hover:bg-blue-700 transition flex items-center justify-center self-end">
                <Search size={18} className="mr-2" />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Filtres</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Spécialité</h3>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Toutes les spécialités</option>
                    <option>Médecine générale</option>
                    <option>Cardiologie</option>
                    <option>Pédiatrie</option>
                    <option>Gynécologie</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Type de prestataire</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">Cliniques</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">Centres médicaux</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">Médecins</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-700">Laboratoires</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Prix</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Min: {filters.priceMin} €</span>
                      <span className="text-gray-600 text-sm">Max: {filters.priceMax} €</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({ ...filters, priceMax: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Évaluation</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="rating" className="text-blue-600 focus:ring-blue-500" />
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${star <= 4 ? 'text-amber-400' : 'text-gray-300'}`}
                            fill={star <= 4 ? 'currentColor' : 'none'}
                          />
                        ))}
                        <span className="ml-1 text-gray-700">& plus</span>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="rating" className="text-blue-600 focus:ring-blue-500" />
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${star <= 3 ? 'text-amber-400' : 'text-gray-300'}`}
                            fill={star <= 3 ? 'currentColor' : 'none'}
                          />
                        ))}
                        <span className="ml-1 text-gray-700">& plus</span>
                      </div>
                    </label>
                  </div>
                </div>

                <button className="w-full bg-gray-100 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-200 transition">
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold mb-2 sm:mb-0">{founded} prestataires trouvés</h2>

              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Trier par:</span>
                <select className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Recommandés</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Meilleures évaluations</option>
                  <option>Distance</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {providers.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      <Image src={provider.image} width={100} height={50} alt={provider.name} className="w-full h-full object-fit" loading="lazy" />
                    </div>

                    <div className="p-6 md:w-3/4">
                      <div className="flex flex-col sm:flex-row justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{provider.name}</h3>
                          <p className="text-gray-500">{provider.type} • {provider.specialty}</p>
                        </div>

                        <div className="flex items-center mt-2 sm:mt-0">
                          <div className="flex items-center mr-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={`${star <= Math.floor(provider.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                                fill={star <= Math.floor(provider.rating) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="text-gray-700">{provider.rating} ({provider.reviews})</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center mb-4">
                        <div className="flex items-center mb-2 md:mb-0 md:mr-4">
                          <MapPin size={16} className="text-gray-500 mr-1" />
                          <span className="text-gray-700">{provider.location}</span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <Clock size={16} className="mr-1" />
                          <span>Disponible sous 24h</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Services disponibles:</h4>
                        <div className="flex flex-wrap gap-2">
                          {provider.services.map((service, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="mb-2 sm:mb-0">
                          <span className="text-gray-500">Prix à partir de:</span>
                          <span className="text-2xl font-bold text-blue-700 ml-2">{provider.price} €</span>
                        </div>

                        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                  Précédent
                </button>
                <button className="px-4 py-2 border border-blue-600 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  1
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                  2
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DefaultTemplate>
  );
}