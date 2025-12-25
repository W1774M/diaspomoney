'use client';

import { SPECIALITY_TYPES } from '@/lib/constants';
import type { Service } from '@/hooks/services';
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
  const [formData, setFormData] = useState({
    id: service?.id || '',
    category: service?.category || SPECIALITY_TYPES.HEALTH,
    label: service?.label || '',
    description: service?.description || '',
    price: service?.price || 0,
    isActive: (service as any)?.isActive ?? true,
    metadata: (service as any)?.metadata || {},
    associatedOptions: (service as any)?.associatedOptions || [],
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.id.trim()) {
      alert("L'ID du service est requis");
      return;
    }
    if (!formData.label.trim()) {
      alert('Le libellé est requis');
      return;
    }
    if (!formData.description.trim()) {
      alert('La description est requise');
      return;
    }
    if (formData.price < 0) {
      alert('Le prix doit être positif');
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
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID du service <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!service}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="ex: consultation-general"
              required
            />
            {service && (
              <p className="mt-1 text-xs text-gray-500">L'ID ne peut pas être modifié</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="ex: Consultation générale"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="Description du service..."
              rows={4}
              required
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
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
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Service actif (visible pour les utilisateurs)
            </label>
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
              className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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


