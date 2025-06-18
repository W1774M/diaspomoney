import { ReactNode } from "react";

interface ServicesButtonProps {
  icon: ReactNode;
  title: string;
  description: string;
  label: string;
  setActiveView: (view: string) => void;
}

export function ServicesButton({
  icon,
  title,
  description,
  label,
  setActiveView,
}: ServicesButtonProps) {
  return (
    <button
      onClick={() => setActiveView(label)}
      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <div className="mr-4">{icon}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
}
