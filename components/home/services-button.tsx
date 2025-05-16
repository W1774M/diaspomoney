export function ServicesButton({setActiveView, label, icon, title, description}: { setActiveView: (view: string) => void, label: string, icon: React.ReactNode, title: string, description: string }) {
  return (
  <button
    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group hover:cursor-pointer"
    onClick={() => setActiveView(`/${label}`)}
  >
    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200">
     {icon}
    </div>
    <div className="text-left">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </button>
  );
}