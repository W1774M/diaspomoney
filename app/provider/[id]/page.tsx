"use client";
import { providers } from "@/lib/datas/providers";
import DefaultTemplate from "@/template/DefaultTemplate";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProviderPage() {
  const params = useParams();
  const providerId = params?.id?.[0];
  const [openImg, setOpenImg] = useState<string | null>(null);

  // Trouver le provider correspondant
  const provider = providers.find((p) => p.id.toString() === providerId);

  if (!provider) {
    return <DefaultTemplate>Prestataire introuvable.</DefaultTemplate>;
  }

  return (
    <DefaultTemplate>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">{provider.name}</h1>
        <p className="mb-2">
          <strong>Type :</strong> {provider.type.value}
        </p>
        <p className="mb-2">
          <strong>Spécialité :</strong> {provider.specialty}
        </p>
        <p className="mb-2">
          <strong>Adresse :</strong> {provider.apiGeo[0]?.display_name}
        </p>
        <p className="mb-2">
          <strong>Note :</strong> {provider.rating} ({provider.reviews} avis)
        </p>
        <div className="mb-4">
          <strong>Services :</strong>
          <ul className="list-disc ml-6">
            {provider.services.map((service, idx) => (
              <li key={idx}>
                {service.name} - {service.price} €
              </li>
            ))}
          </ul>
        </div>
        {provider.images && provider.images.length > 0 && (
          <>
            <div className="flex gap-2 mt-4">
              {provider.images.slice(0, 3).map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1} de ${provider.name}`}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded border cursor-pointer"
                  onClick={() => setOpenImg(img)}
                />
              ))}
            </div>
            {openImg && (
              <div
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                onClick={() => setOpenImg(null)}
              >
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Image
                    src={openImg}
                    alt="Image en grand"
                    width={600}
                    height={400}
                    className="rounded shadow-lg max-w-full max-h-[80vh]"
                  />
                  <button
                    className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-50 rounded-full px-3 py-1"
                    onClick={() => setOpenImg(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p>{provider?.description}</p>
        </div>

        {provider.availabilities && provider.availabilities.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Disponibilités</h2>
            <ul className="list-disc ml-6">
              {provider.availabilities.map((slot: string, idx: number) => {
                const [datePart, timePart] = slot.split(" ");
                const [year, month, day] = datePart.split("/");
                const formattedDate = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day),
                  Number(timePart.split(":")[0]),
                  Number(timePart.split(":")[1])
                );
                const display = formattedDate.toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li key={idx}>
                    <button
                      className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                      onClick={() => alert(`Réservé pour le ${display}`)}
                    >
                      {display}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DefaultTemplate>
  );
}
