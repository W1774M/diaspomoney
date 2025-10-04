import { ServicesButtonProps } from "@/types";

export function ServicesButton({
  icon,
  title,
  description,
  onClick,
}: ServicesButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
    >
      <div className="mr-4">{icon}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
}
