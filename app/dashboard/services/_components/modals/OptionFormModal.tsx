'use client';

import type { ServiceOption } from '@/hooks/services';
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
              {option ? "Modifier l'option" : 'Créer une nouvelle option'}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cette option peut être associée à plusieurs services de catégories différentes.
              La catégorie sera déterminée automatiquement selon les services associés.
            </p>
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
              placeholder="ex: Consultation urgente"
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
              placeholder="Description de l'option..."
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
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="optional"
              checked={formData.optional}
              onChange={(e) => setFormData({ ...formData, optional: e.target.checked })}
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
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
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
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
              className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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


