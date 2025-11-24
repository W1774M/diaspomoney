interface BenefitCardProps {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  title: string;
  description: string;
}

export function BenefitCard({
  icon,
  iconBgColor,
  iconTextColor,
  title,
  description,
}: BenefitCardProps) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group">
      <div
        className={`w-16 h-16 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}
      >
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-base">{description}</p>
    </div>
  );
}

