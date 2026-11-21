'use client';

import { useState } from 'react';
import { X, Loader2, Download } from 'lucide-react';

interface DownloadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (selectedElements: string[]) => Promise<void>;
  downloading: boolean;
}

export default function DownloadSummaryModal({
  isOpen,
  onClose,
  onDownload,
  downloading,
}: DownloadSummaryModalProps) {
  const [selectedElements, setSelectedElements] = useState<{
    clientInfo: boolean;
    beneficiaryInfo: boolean;
    serviceDetails: boolean;
    paymentInfo: boolean;
    appointmentInfo: boolean;
    additionalOptions: boolean;
    progressHistory: boolean;
    providerInfo: boolean;
  }>({
    clientInfo: true,
    beneficiaryInfo: true,
    serviceDetails: true,
    paymentInfo: true,
    appointmentInfo: true,
    additionalOptions: true,
    progressHistory: true,
    providerInfo: true,
  });

  const handleDownload = async () => {
    const elements = Object.entries(selectedElements)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => key);
    
    await onDownload(elements);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !downloading) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Télécharger le résumé de la commande</h3>
          <button
            onClick={onClose}
            disabled={downloading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez les éléments à inclure dans le résumé PDF :
          </p>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.clientInfo}
                onChange={(e) => setSelectedElements({ ...selectedElements, clientInfo: e.target.checked })}
                disabled={downloading}
              />
              Informations client
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.beneficiaryInfo}
                onChange={(e) => setSelectedElements({ ...selectedElements, beneficiaryInfo: e.target.checked })}
                disabled={downloading}
              />
              Informations bénéficiaire
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.serviceDetails}
                onChange={(e) => setSelectedElements({ ...selectedElements, serviceDetails: e.target.checked })}
                disabled={downloading}
              />
              Détails du service
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.paymentInfo}
                onChange={(e) => setSelectedElements({ ...selectedElements, paymentInfo: e.target.checked })}
                disabled={downloading}
              />
              Informations de paiement
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.appointmentInfo}
                onChange={(e) => setSelectedElements({ ...selectedElements, appointmentInfo: e.target.checked })}
                disabled={downloading}
              />
              Informations de rendez-vous
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.additionalOptions}
                onChange={(e) => setSelectedElements({ ...selectedElements, additionalOptions: e.target.checked })}
                disabled={downloading}
              />
              Options supplémentaires
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.progressHistory}
                onChange={(e) => setSelectedElements({ ...selectedElements, progressHistory: e.target.checked })}
                disabled={downloading}
              />
              Historique de progression
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedElements.providerInfo}
                onChange={(e) => setSelectedElements({ ...selectedElements, providerInfo: e.target.checked })}
                disabled={downloading}
              />
              Informations prestataire
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || Object.values(selectedElements).every(v => !v)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Télécharger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
