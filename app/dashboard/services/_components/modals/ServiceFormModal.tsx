'use client';

import { useNotificationManager } from '@/components/ui/Notification';
import { SPECIALITY_TYPES } from '@/lib/constants';
import type { Service } from '@/hooks/services';
import { MarkdownDescriptionField } from '@/components/common/MarkdownDescriptionField';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export interface ServiceFormModalProps {
  service: Service | null;
  onSave: (data: {
    id: string;
    category: string;
    label: string;
    description: string;
    price: number;
    isActive: boolean;
    important: boolean;
    metadata?: Record<string, any>;
    associatedOptions?: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ServiceFormModal({
  service,
  onSave,
  onCancel,
  isSubmitting,
}: ServiceFormModalProps) {
  const notifier = useNotificationManager();
  const [formData, setFormData] = useState({
    id: service?.id || '',
    category: service?.category || SPECIALITY_TYPES.HEALTH,
    label: service?.label || '',
    description: service?.description || '',
    price: service?.price || 0,
    isActive: service?.isActive ?? true,
    important: service?.important ?? false,
    metadata: service?.metadata || {},
    associatedOptions: service?.associatedOptions || [],
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.id.trim()) {
      notifier.addWarning("L'ID du service est requis");
      return;
    }
    if (!formData.label.trim()) {
      notifier.addWarning('Le libellé est requis');
      return;
    }
    if (!formData.description.trim()) {
      notifier.addWarning('La description est requise');
      return;
    }
    if (formData.price < 0) {
      notifier.addWarning('Le prix doit être positif');
      return;
    }

    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {service ? 'Modifier le service' : 'Créer un nouveau service'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-600 transition-colors"
              type="button"
              title="Fermer"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor='service-form-modal-id' className="block text-sm font-medium text-gray-700 mb-2">
              ID du service <span className="text-red-500">*</span>
            </label>
            <input id='service-form-modal-id'
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!service}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="ex: consultation-general"
              required
            />
            {service && (
              <p className="mt-1 text-xs text-gray-500">L'ID ne peut pas être modifié</p>
            )}
          </div>

          <div>
            <label htmlFor='service-form-modal-category' className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select id='service-form-modal-category'
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
              required
              title="Catégorie du service"
              aria-label="Catégorie du service"
            >
              <option value={SPECIALITY_TYPES.HEALTH}>Santé</option>
              <option value={SPECIALITY_TYPES.EDUCATION}>Éducation</option>
              <option value={SPECIALITY_TYPES.BTP}>Immobilier & BTP</option>
            </select>
          </div>

          <div>
            <label htmlFor='service-form-modal-label' className="block text-sm font-medium text-gray-700 mb-2">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input id='service-form-modal-label'
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
              placeholder="ex: Consultation générale"
              required
              maxLength={200}
            />
          </div>

          <MarkdownDescriptionField
            label={
              <>
                Description <span className="text-red-500">*</span>
              </>
            }
            value={formData.description}
            onChange={(description) => setFormData({ ...formData, description })}
            placeholder="Premier paragraphe (accroche).

Deuxième paragraphe : détails, **points importants**, listes :
- élément 1
- élément 2

Conditions : voir [nos CGU](https://diaspomoney.fr)."
            required
            maxLength={1000}
            rows={12}
          />

          <div>
            <label htmlFor='service-form-modal-price' className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input id='service-form-modal-price'
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
            {formData.price === 0 && (
              <p className="mt-1 text-xs text-gray-500">0€ = Sur devis</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-brand-700 focus-visible:ring-brand-600 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Service actif (visible pour les utilisateurs)
            </label>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="important"
                checked={formData.important}
                onChange={(e) => setFormData({ ...formData, important: e.target.checked })}
                className="mt-1 h-4 w-4 text-brand-700 focus-visible:ring-brand-600 border-gray-300 rounded"
              />
              <label htmlFor="important" className="ml-3 block text-sm text-gray-800">
                <span className="font-semibold">Service important</span>
                <span className="block text-gray-600">
                  S&apos;il est activé, ce service ressortira visuellement dans le parcours de réservation.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{service ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


