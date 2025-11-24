/**
 * Page de détails d'un service
 * Utilise les types, constantes et schémas centralisés
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ServiceBookingWizard } from '@/components/services/ServiceBookingWizard';
import { SPECIALITY_TYPES } from '@/lib/constants';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Shield, 
  Heart, 
  GraduationCap, 
  Home,
  Calendar,
} from 'lucide-react';
import type { ServiceType } from '@/lib/types/constants.types';
import { logger } from '@/lib/logger';

// Mapping des types de service vers les icônes et labels
const SERVICE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  [SPECIALITY_TYPES.HEALTH]: {
    icon: <Heart className="w-8 h-8" />,
    label: 'Santé',
    color: 'text-red-500',
  },
  [SPECIALITY_TYPES.EDUCATION]: {
    icon: <GraduationCap className="w-8 h-8" />,
    label: 'Éducation',
    color: 'text-blue-500',
  },
  [SPECIALITY_TYPES.BTP]: {
    icon: <Home className="w-8 h-8" />,
    label: 'Immobilier',
    color: 'text-green-500',
  },
};

// Mapping de l'ID URL vers le type de service
// Les paramètres acceptés sont : health, edu, immo
const mapIdToServiceType = (id: string): ServiceType | null => {
  const idLower = id.toLowerCase();
  if (idLower === 'health' || idLower === 'sante' || idLower === SPECIALITY_TYPES.HEALTH.toLowerCase()) {
    return SPECIALITY_TYPES.HEALTH as ServiceType;
  }
  if (idLower === 'edu' || idLower === 'education' || idLower === SPECIALITY_TYPES.EDUCATION.toLowerCase()) {
    return SPECIALITY_TYPES.EDUCATION as ServiceType;
  }
  if (idLower === 'immo' || idLower === 'btp' || idLower === 'housing' || idLower === SPECIALITY_TYPES.BTP.toLowerCase()) {
    return SPECIALITY_TYPES.BTP as ServiceType;
  }
  return null;
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // L'ID correspond au type de service (health, education, btp)
  const serviceType = mapIdToServiceType(serviceId || '');
  const [showBookingWizard, setShowBookingWizard] = useState(false);

  if (!serviceType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Type de service invalide
          </h2>
          <p className="text-gray-600 mb-6">
            Le type de service "{serviceId}" n'est pas reconnu.
          </p>
          <button
            onClick={() => router.push('/services')}
            className="bg-[hsl(25,100%,53%)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition"
            type="button"
          >
            Retour aux services
          </button>
        </div>
      </div>
    );
  }

  const serviceTypeConfig = SERVICE_TYPE_CONFIG[serviceType] || {
    icon: <Shield className="w-8 h-8" />,
    label: serviceType,
    color: 'text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showBookingWizard ? (
        <div className="py-8">
          <div className="container mx-auto px-4">
            <button
              onClick={() => setShowBookingWizard(false)}
              className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] mb-6 transition"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour aux détails
            </button>
            <ServiceBookingWizard
              initialServiceType={serviceType}
              onComplete={(bookingId) => {
                // Ne pas rediriger automatiquement - laisser l'utilisateur voir l'étape 4 de confirmation
                // La redirection se fera via les boutons dans l'étape 4
                logger.info({ bookingId: bookingId as string }, 'Booking completed');
              }}
              onCancel={() => setShowBookingWizard(false)}
            />
          </div>
        </div>
      ) : (
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header avec bouton retour */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/services')}
                className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] transition"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour aux services
              </button>
            </div>

            {/* Carte principale du service */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className={`${serviceTypeConfig.color} flex-shrink-0`}>
                  {serviceTypeConfig.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Services {serviceTypeConfig.label}</h1>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {serviceTypeConfig.label}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mb-4">
                    {serviceType === SPECIALITY_TYPES.HEALTH && 
                      "Accès à un réseau de professionnels de santé certifiés pour vous et vos proches."}
                    {serviceType === SPECIALITY_TYPES.EDUCATION && 
                      "Paiement direct et sécurisé des frais d'éducation pour vos proches."}
                    {serviceType === SPECIALITY_TYPES.BTP && 
                      "Accompagnement dans la recherche, la location et la construction de biens immobiliers."}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Disponible immédiatement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Garanti DiaspoMoney</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setShowBookingWizard(true)}
                    className="flex items-center gap-2 bg-[hsl(25,100%,53%)] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition shadow-lg"
                    type="button"
                  >
                    <Calendar className="w-5 h-5" />
                    Commencer la réservation
                  </button>
                </div>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Caractéristiques */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Caractéristiques
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Services adaptés à vos besoins
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Paiement sécurisé via Stripe
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Suivi en temps réel
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      Garantie de remboursement
                    </span>
                  </li>
                </ul>
              </div>

              {/* Processus */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Comment ça marche
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[hsl(25,100%,53%)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <span className="text-gray-700">
                      Sélectionnez le service et remplissez vos informations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[hsl(25,100%,53%)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <span className="text-gray-700">
                      Effectuez le paiement de manière sécurisée
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[hsl(25,100%,53%)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <span className="text-gray-700">
                      Choisissez les disponibilités de votre bénéficiaire
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[hsl(25,100%,53%)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    <span className="text-gray-700">
                      Vous serez recontacté rapidement pour le suivi
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Section garanties */}
            <div className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] rounded-lg shadow-lg p-8 text-white mb-8">
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">
                    Garantie DiaspoMoney
                  </h3>
                  <p className="text-white/90 mb-4">
                    Nous garantissons l'exécution de votre service. Si le service n'est pas 
                    exécuté dans les délais convenus, vous serez intégralement remboursé.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      <span>Remboursement garanti si service non exécuté</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      <span>Suivi personnalisé par un Country Sales Manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      <span>Support client disponible 24/7</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ ou informations supplémentaires */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Questions fréquentes
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Combien de temps prend le traitement ?
                  </h4>
                  <p className="text-gray-600">
                    Le traitement commence généralement sous 24-48h après confirmation du paiement.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Puis-je annuler ma réservation ?
                  </h4>
                  <p className="text-gray-600">
                    Oui, vous pouvez annuler votre réservation jusqu'à 24h avant le rendez-vous 
                    et être intégralement remboursé.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Comment puis-je suivre mon service ?
                  </h4>
                  <p className="text-gray-600">
                    Vous recevrez des notifications par email et SMS à chaque étape. 
                    Vous pouvez également suivre l'avancement depuis votre tableau de bord.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
