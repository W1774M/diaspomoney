'use client';

import { X, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { BookingEditData } from '@/hooks/bookings/useBookingEdit';
import { PhoneInput } from 'react-international-phone';
import { useServices, useServiceOptions } from '@/hooks/services';

interface BookingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  editData: BookingEditData;
  setEditData: (data: BookingEditData | ((prev: BookingEditData) => BookingEditData)) => void;
  isSaving: boolean;
  isValidatingPromoCode: boolean;
  promoCodeData: any;
  promoCodeError: string | null;
  onValidatePromoCode: (code: string) => Promise<void>;
  isPaymentCompleted: boolean;
}

export default function BookingEditModal({
  isOpen,
  onClose,
  onSave,
  editData,
  setEditData,
  isSaving,
  isValidatingPromoCode,
  promoCodeData,
  promoCodeError,
  onValidatePromoCode,
  isPaymentCompleted,
}: BookingEditModalProps) {
  // Récupérer les services et options disponibles
  const { services, loading: servicesLoading } = useServices({ isActive: true });
  const { options: allOptions, loading: optionsLoading } = useServiceOptions({ isActive: true });

  // Trouver le service sélectionné
  const selectedService = useMemo(() => {
    if (!editData.serviceId && !editData.serviceLabel) return null;
    return services.find(
      (s) => s.id === editData.serviceId || s.label === editData.serviceLabel
    ) || null;
  }, [services, editData.serviceId, editData.serviceLabel]);

  // Filtrer les options disponibles pour le service sélectionné
  const availableOptions = useMemo(() => {
    if (!selectedService) return [];
    return allOptions.filter(
      (opt) =>
        !opt.associatedServices ||
        opt.associatedServices.length === 0 ||
        opt.associatedServices.includes(selectedService.id)
    );
  }, [allOptions, selectedService]);

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isSaving]);

  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Mettre à jour automatiquement le prix et la description quand le service change
  useEffect(() => {
    if (selectedService) {
      setEditData((prev) => {
        const updated: BookingEditData = {
          ...prev,
          serviceId: selectedService.id,
          serviceLabel: selectedService.label,
          servicePrice: selectedService.price,
        };
        if (selectedService.description) {
          updated.serviceDescription = selectedService.description;
        } else if (prev.serviceDescription) {
          updated.serviceDescription = prev.serviceDescription;
        }
        return updated;
      });
    }
  }, [selectedService, setEditData]);

  if (!isOpen) return null;

  const handlePromoCodeChange = (value: string) => {
    setEditData((prev) => ({ ...prev, promotionCode: value }));
    if (value.trim()) {
      onValidatePromoCode(value);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setEditData((prev) => ({
        ...prev,
        serviceId: service.id,
        serviceLabel: service.label,
        servicePrice: service.price,
        serviceDescription: service.description || '',
        // Réinitialiser les options supplémentaires quand on change de service
        additionalOptions: [],
      }));
    }
  };

  const handleAddOption = (optionId: string) => {
    const option = availableOptions.find((opt) => opt.id === optionId);
    if (option) {
      const newOptions = [...(editData.additionalOptions || [])];
      // Vérifier si l'option n'est pas déjà ajoutée
      if (!newOptions.find((opt: any) => opt.id === optionId)) {
        newOptions.push({
          id: option.id,
          label: option.label,
          price: option.price,
        });
        setEditData((prev) => ({ ...prev, additionalOptions: newOptions }));
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 id="edit-modal-title" className="text-xl font-semibold text-gray-900">
            Éditer la réservation
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Informations client */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations client</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editData.clientFirstName || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, clientFirstName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editData.clientLastName || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, clientLastName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.clientEmail || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, clientEmail: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <PhoneInput
                    defaultCountry="fr"
                    value={editData.clientPhone || ''}
                    onChange={(phone) =>
                      setEditData((prev) => ({ ...prev, clientPhone: phone }))
                    }
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Informations bénéficiaire */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations bénéficiaire</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editData.beneficiaryFirstName || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, beneficiaryFirstName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editData.beneficiaryLastName || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, beneficiaryLastName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <PhoneInput
                    defaultCountry="fr"
                    value={editData.beneficiaryPhone || ''}
                    onChange={(phone) =>
                      setEditData((prev) => ({ ...prev, beneficiaryPhone: phone }))
                    }
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.beneficiaryEmail || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, beneficiaryEmail: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Service */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Service</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service <span className="text-red-500">*</span>
                  </label>
                  {servicesLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Chargement des services...</span>
                    </div>
                  ) : (
                    <select
                      value={editData.serviceId || ''}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      required
                    >
                      <option value="">Sélectionner un service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.label} - {service.price}€
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedService && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.servicePrice || selectedService.price || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                        title="Le prix est automatiquement défini selon le service sélectionné"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Prix automatique basé sur le service sélectionné
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editData.serviceDescription || selectedService.description || ''}
                        disabled
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                        title="La description est automatiquement définie selon le service sélectionné"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Options supplémentaires */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Options supplémentaires</h4>
              <div className="space-y-3">
                {!selectedService ? (
                  <p className="text-sm text-gray-500 italic">
                    Veuillez d'abord sélectionner un service pour voir les options disponibles
                  </p>
                ) : optionsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Chargement des options...</span>
                  </div>
                ) : availableOptions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Aucune option supplémentaire disponible pour ce service
                  </p>
                ) : (
                  <>
                    {/* Options déjà sélectionnées */}
                    {editData.additionalOptions && editData.additionalOptions.length > 0 && (
                      <div className="space-y-2">
                        {editData.additionalOptions.map((opt: any, index: number) => {
                          const optionData = availableOptions.find((o) => o.id === opt.id);
                          return (
                            <div
                              key={index}
                              className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {optionData?.label || opt.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {optionData?.description || ''}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {optionData?.price || opt.price || 0}€
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions =
                                    editData.additionalOptions?.filter((_, i) => i !== index) || [];
                                  setEditData((prev) => ({ ...prev, additionalOptions: newOptions }));
                                }}
                                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer cette option"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sélecteur pour ajouter une nouvelle option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ajouter une option
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddOption(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      >
                        <option value="">
                          {editData.additionalOptions && editData.additionalOptions.length > 0
                            ? 'Ajouter une autre option...'
                            : 'Sélectionner une option...'}
                        </option>
                        {availableOptions
                          .filter(
                            (opt) =>
                              !editData.additionalOptions?.find(
                                (selectedOpt: any) => selectedOpt.id === opt.id
                              )
                          )
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label} - {option.price}€
                            </option>
                          ))}
                      </select>
                      {availableOptions.filter(
                        (opt) =>
                          !editData.additionalOptions?.find(
                            (selectedOpt: any) => selectedOpt.id === opt.id
                          )
                      ).length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Toutes les options disponibles ont été ajoutées
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Rendez-vous */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Rendez-vous</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={
                      editData.appointmentDate
                        ? editData.appointmentDate instanceof Date
                          ? editData.appointmentDate.toISOString().split('T')[0]
                          : new Date(editData.appointmentDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        appointmentDate: e.target.value ? new Date(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={editData.timeslot || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, timeslot: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Code promotionnel */}
            {!isPaymentCompleted && (
              <section>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[hsl(25,100%,53%)]" />
                  Code promotionnel
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editData.promotionCode || ''}
                        onChange={(e) => handlePromoCodeChange(e.target.value)}
                        placeholder="Entrez un code promotionnel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent uppercase"
                        disabled={isValidatingPromoCode}
                      />
                    </div>
                    {isValidatingPromoCode && (
                      <div className="flex items-center px-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {promoCodeData && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Code valide : {promoCodeData.percentage}% de réduction
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Réduction appliquée : {promoCodeData.discount?.amount?.toFixed(2) || '0.00'}€
                        </p>
                      </div>
                    </div>
                  )}
                  {promoCodeError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-900">{promoCodeError}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Les codes promotionnels ne peuvent être appliqués que si le paiement n'a pas encore été effectué.
                  </p>
                </div>
              </section>
            )}

            {isPaymentCompleted && (
              <section>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Le paiement a déjà été effectué. Les codes promotionnels ne peuvent plus être modifiés.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-[hsl(25,100%,53%)] rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

