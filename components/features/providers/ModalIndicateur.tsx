"use client";

interface ModalIndicatorProps {
  steps: number;
}

export const ModalIndicator = ({ steps }: ModalIndicatorProps) => {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[55] bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2">
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 ${
            steps >= 0 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 progress-indicator ${
              steps >= 0
                ? "active bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <span className="text-xs font-medium hidden sm:block">
            Réservation
          </span>
        </div>

        <div
          className={`w-6 h-1 rounded-full transition-all duration-300 ${
            steps >= 1 ? "bg-blue-600" : "bg-gray-200"
          }`}
        ></div>

        <div
          className={`flex items-center gap-2 ${
            steps >= 1 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 progress-indicator ${
              steps >= 1
                ? "active bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span className="text-xs font-medium hidden sm:block">Paiement</span>
        </div>

        <div
          className={`w-6 h-1 rounded-full transition-all duration-300 ${
            steps >= 2 ? "bg-blue-600" : "bg-gray-200"
          }`}
        ></div>

        <div
          className={`flex items-center gap-2 ${
            steps >= 2 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 progress-indicator ${
              steps >= 2
                ? "active bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
          <span className="text-xs font-medium hidden sm:block">
            Confirmation
          </span>
        </div>
      </div>
    </div>
  );
};
