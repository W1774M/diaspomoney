interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function ServiceCard({
  icon,
  title,
  description,
  onClick,
}: ServiceCardProps) {
  return (
    <div
      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
      onClick={onClick}
    >
      <div className="mr-4">
        <span className="text-blue-600 text-2xl">{icon}</span>
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

