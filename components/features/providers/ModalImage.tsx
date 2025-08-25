"use client";
import Image from "next/image";

interface ModalImageProps {
  openImg: string;
  setOpenImg: (img: string | null) => void;
}

export const ModalImage = ({ openImg, setOpenImg }: ModalImageProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={() => setOpenImg(null)}
    >
      <div className="relative max-w-4xl max-h-[90vh]">
        <Image
          src={openImg}
          alt="Image agrandie"
          width={800}
          height={600}
          className="w-full h-auto object-contain rounded-lg"
        />
        <button
          className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
          onClick={() => setOpenImg(null)}
        >
          ×
        </button>
      </div>
    </div>
  );
};
