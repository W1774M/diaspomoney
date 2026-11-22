'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';
import { ServiceDescription } from './ServiceDescription';

export interface MarkdownDescriptionFieldProps {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  id?: string;
}

/**
 * Zone de texte + aide Markdown + aperçu (même rendu que sur le site).
 */
export function MarkdownDescriptionField({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  maxLength = 1000,
  rows = 10,
  id: idProp,
}: MarkdownDescriptionFieldProps) {
  const genId = useId();
  const fieldId = idProp ?? `md-desc-${genId}`;
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent font-mono text-sm"
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
        spellCheck
      />
      <p className="mt-1.5 text-xs text-gray-500 leading-snug">
        <span className="font-medium text-gray-600">Mise en forme (Markdown) :</span>{' '}
        ligne vide = nouveau paragraphe ; <code className="bg-gray-100 px-0.5 rounded">**gras**</code> ;{' '}
        listes <code className="bg-gray-100 px-0.5 rounded">- élément</code> ;{' '}
        <code className="bg-gray-100 px-0.5 rounded">## Sous-titre</code> ;{' '}
        lien <code className="bg-gray-100 px-0.5 rounded">[texte](https://…)</code>.{' '}
        L’aperçu correspond à l’affichage public.
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        {value.length} / {maxLength}
      </p>
      <button
        type="button"
        onClick={() => setPreviewOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-800 hover:text-brand-800"
      >
        {previewOpen ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Masquer l&apos;aperçu
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Voir l&apos;aperçu
          </>
        )}
      </button>
      {previewOpen && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-72 overflow-y-auto">
          {value.trim() ? (
            <div className="bg-white rounded-md p-3 border border-gray-100">
              <ServiceDescription content={value} variant="default" />
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Saisissez du texte pour voir l&apos;aperçu.</p>
          )}
        </div>
      )}
    </div>
  );
}
