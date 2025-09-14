import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = "md", 
  showIcon = true 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          iconColor: "bg-green-400",
          label: "Actif"
        };
      case "INACTIVE":
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          iconColor: "bg-gray-400",
          label: "Inactif"
        };
      case "PENDING":
        return {
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          iconColor: "bg-yellow-400",
          label: "En attente"
        };
      case "SUSPENDED":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          iconColor: "bg-red-400",
          label: "Suspendu"
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          iconColor: "bg-gray-400",
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const iconSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}>
      {showIcon && (
        <div className={`${config.iconColor} rounded-full mr-2 ${iconSizeClasses[size]}`}></div>
      )}
      {config.label}
    </span>
  );
};
