/**
 * Sidebar fixe pour le processus de réservation
 * Contient des éléments rassurants qui ne bougent pas pendant le processus
 */

import { Shield, Lock, Clock, CheckCircle, Phone, Mail, Star } from 'lucide-react';
import type { ServiceType } from '@/lib/types/constants.types';

interface ServiceBookingSidebarProps {
  serviceType: ServiceType;
  currentStep: number;
}

const STEP_INFO = [
  {
    step: 1,
    title: 'Informations',
    description: 'Remplissez vos informations, celles du bénéficiaire',
    time: '~ 3 min',
  },
  {
    step: 2,
    title: 'Service & Options',
    description: 'Sélectionnez le service et ajoutez des options si besoin',
    time: '~ 2 min',
  },
  {
    step: 3,
    title: 'Paiement',
    description: 'Effectuez le paiement de manière sécurisée',
    time: '~ 2 min',
  },
  {
    step: 4,
    title: 'Confirmation',
    description: 'Vérification et confirmation finale',
    time: '~ 1 min',
  },
];

export function ServiceBookingSidebar({
  serviceType: _serviceType,
  currentStep,
}: ServiceBookingSidebarProps) {

  return (
    <div className="w-full lg:w-80 lg:sticky lg:top-8 h-fit bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Vous faites
          </h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            Client
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Étapes à compléter avant envoi
        </p>
      </div>

      {/* Étapes */}
      <div className="space-y-4">
        {STEP_INFO.map((stepInfo) => {
          const isActive = currentStep === stepInfo.step;
          const isCompleted = currentStep > stepInfo.step;

          return (
            <div
              key={stepInfo.step}
              className={`flex gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-[hsl(25,100%,95%)] border-2 border-[hsl(25,100%,53%)]'
                  : isCompleted
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  isActive
                    ? 'bg-[hsl(25,100%,53%)] text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stepInfo.step
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`font-medium ${
                      isActive
                        ? 'text-[hsl(25,100%,53%)]'
                        : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {stepInfo.title}
                  </h4>
                  <span className="text-xs text-gray-500">{stepInfo.time}</span>
                </div>
                <p className="text-xs text-gray-600">{stepInfo.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Séparateur */}
      <div className="border-t pt-4">
        <p className="text-sm text-center text-gray-600 italic">
          Ensuite, notre équipe prend le relais
        </p>
      </div>

      {/* Section "On s'en charge" */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            On s'en charge
          </h3>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
            DiaspoMoney
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Traitement par notre équipe (24-72h ouvrées)
        </p>

        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 text-sm mb-1">
                Vérification
              </h4>
              <p className="text-xs text-gray-600">
                Contrôle des informations. On vous contacte si besoin.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 text-sm mb-1">
                Prise de contact
              </h4>
              <p className="text-xs text-gray-600">
                Nous vous recontactons rapidement pour le suivi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Garanties et sécurité */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 text-sm mb-1">
              Paiement sécurisé
            </h4>
            <p className="text-xs text-green-700">
              Vos données sont protégées par un cryptage SSL.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm mb-1">
              Garantie DiaspoMoney
            </h4>
            <p className="text-xs text-blue-700">
              Remboursement garanti si service non exécuté.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 text-sm mb-1">
              Traitement rapide
            </h4>
            <p className="text-xs text-orange-700">
              Réponse sous 24-72h ouvrées.
            </p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 text-sm mb-3">
          Besoin d'aide ?
        </h4>
        <div className="space-y-2">
          <a
            href="tel:+33123456789"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[hsl(25,100%,53%)] transition"
          >
            <Phone className="w-4 h-4" />
            <span>+33 1 23 45 67 89</span>
          </a>
          <a
            href="mailto:support@diaspomoney.com"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[hsl(25,100%,53%)] transition"
          >
            <Mail className="w-4 h-4" />
            <span>support@diaspomoney.com</span>
          </a>
        </div>
      </div>

      {/* Avis clients */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-semibold text-gray-900">4.8/5</span>
          <span className="text-xs text-gray-500">(1,234 avis)</span>
        </div>
        <p className="text-xs text-gray-600">
          "Service rapide et professionnel. Je recommande !"
        </p>
      </div>
    </div>
  );
}

