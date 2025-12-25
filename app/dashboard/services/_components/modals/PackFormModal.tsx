'use client';

import { SPECIALITY_TYPES } from '@/lib/constants';
import type { Service } from '@/hooks/services';
import { X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

export interface PackFormModalProps {
  pack: any | null;
  services: Service[];
  onSave: (data: {
    label: string;
    description?: string;
    category: string;
    serviceIds: string[];
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function PackFormModal({
  pack,
  services,
  onSave,
  onCancel,
  isSubmitting,
}: PackFormModalProps) {
  const [formData, setFormData] = useState({
    label: pack?.label || '',
    description: pack?.description || '',
    category: pack?.category || SPECIALITY_TYPES.HEALTH,
    serviceIds: Array.isArray(pack?.serviceIds) ? pack.serviceIds : [],
    isActive: pack?.isActive !== false,
  });

  const availableServices = useMemo(() => {
    return services
      .filter(s => s.category === formData.category)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [services, formData.category]);

  const toggleService = (serviceId: string) => {
    setFormData(current => {
      const exists = current.serviceIds.includes(serviceId);
      return {
        ...current,
        serviceIds: exists
          ? current.serviceIds.filter((id: string) => id !== serviceId)
          : [...current.serviceIds, serviceId],
      };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      alert('Le nom du pack est requis');
      return;
    }
    if (!formData.serviceIds.length) {
      alert('Sélectionnez au moins un service');
      return;
    }

    await onSave({
      label: formData.label.trim(),
      description: formData.description?.trim() || undefined,
      category: formData.category,
      serviceIds: formData.serviceIds,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {pack ? 'Modifier le pack' : 'Créer un nouveau pack'}
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
              Nom du pack <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="ex: Pack Santé"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="Décrivez ce pack..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value, serviceIds: [] })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              required
              title="Catégorie du pack"
            >
              <option value={SPECIALITY_TYPES.HEALTH}>Santé</option>
              <option value={SPECIALITY_TYPES.EDUCATION}>Éducation</option>
              <option value={SPECIALITY_TYPES.BTP}>Immobilier & BTP</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Les services proposés ci-dessous sont filtrés par catégorie.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services inclus <span className="text-red-500">*</span>
            </label>
            {availableServices.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun service disponible dans cette catégorie.
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {availableServices.map((s) => (
                  <label key={s.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="mt-1 h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.label}</div>
                      <div className="text-xs text-gray-500">{s.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActivePack"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
            />
            <label htmlFor="isActivePack" className="ml-2 block text-sm text-gray-700">
              Pack actif (visible)
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
                <span>{pack ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


