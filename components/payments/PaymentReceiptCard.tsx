"use client";

import { Calendar, Download, Eye, FileText } from "lucide-react";
import { useState } from "react";

interface PaymentReceipt {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  paymentMethod: string;
  service: string;
  provider: string;
  date: string;
  description: string;
  downloadUrl: string;
}

interface PaymentReceiptCardProps {
  receipt: PaymentReceipt;
  onView?: (receipt: PaymentReceipt) => void;
  onDownload?: (receipt: PaymentReceipt) => void;
}

export function PaymentReceiptCard({
  receipt,
  onView,
  onDownload,
}: PaymentReceiptCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Payé";
      case "pending":
        return "En attente";
      case "failed":
        return "Échec";
      case "refunded":
        return "Remboursé";
      default:
        return status;
    }
  };

  const handleView = () => {
    if (onView) {
      onView(receipt);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(receipt);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-all duration-200 ${
        isHovered ? "bg-gray-50 shadow-md" : "hover:bg-gray-50"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 bg-[hsl(25,100%,53%)]/10 rounded-lg">
          <FileText className="h-6 w-6 text-[hsl(25,100%,53%)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className="font-medium text-gray-900">
              {receipt.invoiceNumber}
            </span>
            <span
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                receipt.status
              )}`}
            >
              {getStatusText(receipt.status)}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">{receipt.service}</p>
            <p>Fourni par {receipt.provider}</p>
            <p className="text-gray-500">{receipt.description}</p>
          </div>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(receipt.date).toLocaleDateString("fr-FR")}
            </div>
            <div>{receipt.paymentMethod}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {receipt.amount.toFixed(2)} {receipt.currency}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors"
            title="Voir le reçu"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors"
            title="Télécharger le reçu"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
