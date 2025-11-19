"use client";

import {
  formatComplaintDate,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText,
  getTypeText,
} from "@/lib/complaints/utils";
import type { ComplaintCardProps } from "@/lib/types";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
} from "lucide-react";
import React from "react";

const ComplaintCard = React.memo<ComplaintCardProps>(function ComplaintCard({
  complaint,
  onView,
  onComment,
}) {
  // const router = useRouter();

  const statusText = getStatusText(complaint.status);
  const statusColor = getStatusColor(complaint.status);
  const priorityText = getPriorityText(complaint.priority);
  const priorityColor = getPriorityColor(complaint.priority);
  const typeText = getTypeText(complaint.type);
  const createdDate = formatComplaintDate(complaint.createdAt.toISOString());
  const updatedDate = formatComplaintDate(complaint.updatedAt.toISOString());

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {complaint.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
              >
                {statusText}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}
              >
                {priorityText}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <span className="font-medium">#{complaint.number}</span>
              <span>•</span>
              <span>{typeText}</span>
              <span>•</span>
              <span>{complaint.provider}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Créée le {createdDate}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Mise à jour le {updatedDate}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{complaint.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(complaint)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir détails
          </button>
          {complaint.status === "OPEN" && (
            <button
              onClick={() => onComment(complaint)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Ajouter un commentaire
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ComplaintCard.displayName = "ComplaintCard";

export default ComplaintCard;
