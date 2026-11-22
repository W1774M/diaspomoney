'use client';

import { useNotificationManager } from '@/components/ui/Notification';
import type { ServiceOption } from '@/hooks/services';
import { MarkdownDescriptionField } from '@/components/common/MarkdownDescriptionField';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export interface OptionFormModalProps {
  option: ServiceOption | null;
  onSave: (data: {
    label: string;
    description: string;
    price: number;
    optional: boolean;
    isActive: boolean;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function OptionFormModal({
  option,
  onSave,
  onCancel,
  isSubmitting,
}: OptionFormModalProps) {
  const notifier = useNotificationManager();
  const [formData, setFormData] = useState({
    label: option?.label || '',
    description: option?.description || '',
    price: option?.price || 0,
    optional: option?.optional ?? true,
    isActive: (option as any)?.isActive ?? true,
    metadata: (option as any)?.metadata || {},
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
              {option ? "Modifier l'option" : 'Créer une nouvelle option'}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-brand-800">
              <strong>Note :</strong> Cette option peut être associée à plusieurs services de catégories différentes.
              La catégorie sera déterminée automatiquement selon les services associés.
            </p>
          </div>

          <div>
            <label htmlFor='option-form-modal-label' className="block text-sm font-medium text-gray-700 mb-2">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input id='option-form-modal-label'
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent"
              placeholder="ex: Consultation urgente"
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
            placeholder="Description courte + détails en **gras** ou listes si besoin."
            required
            maxLength={1000}
            rows={10}
          />

          <div>
            <label htmlFor='option-form-modal-price' className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input id='option-form-modal-price'
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
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="optional"
              checked={formData.optional}
              onChange={(e) => setFormData({ ...formData, optional: e.target.checked })}
              className="h-4 w-4 text-brand-700 focus-visible:ring-brand-600 border-gray-300 rounded"
            />
            <label htmlFor="optional" className="ml-2 block text-sm text-gray-700">
              Option facultative (l'utilisateur peut choisir de l'ajouter ou non)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveOption"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-brand-700 focus-visible:ring-brand-600 border-gray-300 rounded"
            />
            <label htmlFor="isActiveOption" className="ml-2 block text-sm text-gray-700">
              Option active (visible pour les utilisateurs)
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
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{option ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


