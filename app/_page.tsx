import Hero from "@/components/home/hero";
import DefaultTemplate from "@/template/DefaultTemplate";
import Image from "next/image";

export default function Home() {
  return (
    <DefaultTemplate>
      <div className="flex flex-col justify-center min-h-screen bg-gray-100">
        <div className="bg-white w-full">
          <h1 className="text-3xl font-bold text-center mb-4 w-full">
          Envoie, investis, réalise. Tout devient simple et transparent.​</h1>
        </div>
          <Hero />
          <div className="flex p-4 justify-center">
            <div className="w-[200px] font-bold capitalize text-amber-300 border border-amber-300 h-[50px] m-3 text-center rounded-3xl">Item 5</div>
            <div className="w-[200px] font-bold capitalize text-amber-300 border border-amber-300 h-[50px] m-3 text-center rounded-3xl">Item 6</div>
            <div className="w-[200px] font-bold capitalize text-amber-300 border border-amber-300 h-[50px] m-3 text-center rounded-3xl">Item 7</div>
          </div>
          <div className="flex p-4 justify-center">
            <div className="w-[400px] h-auto m-3 text-center overflow-hidden">
              <div className="w-full h-[100px]">
                <Image  src="/img/Logo_Diaspo_Horizontal_enrichi.webp" width={100} height={50} alt="Healthcare" className="w-full h-full object-fit" />
              </div>
              <div className="p-2">
                Accédez aux meilleurs soins, grâce à notre sélection des meilleures infrastructures et professionnels de santé.
              </div>
            </div>
            <div className="w-[400px] h-auto m-3 text-center overflow-hidden">
              <div className="w-full h-[100px]">
                <Image  src="/img/Logo_Diaspo_Horizontal_enrichi.webp" width={100} height={50} alt="Healthcare" className="w-full h-full object-fit" />
              </div>
              <div className="p-2">
              Aidez vos proches au pays à poursuivre des études de bonne qualité.
              </div>
            </div>
            <div className="w-[400px] h-auto m-3 text-center overflow-hidden">
              <div className="w-full h-[100px]">
                <Image  src="/img/Logo_Diaspo_Horizontal_enrichi.webp" width={100} height={50} alt="Healthcare" className="w-full h-full object-fit" />
              </div>
              <div className="p-2">
              Réalisez vos projets immobiliers et mobiliers en maîtrisant parfaitement vos coûts, grâce à notre système engagé et sécurisé.
              </div>
            </div>
          
          </div>
          <div className="flex mt-4 p-4 justify-center">
            <div className="w-[400px] font-bold capitalize h-[100px] m-3 text-center rounded-3xl">
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">IMG</div>
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">TEXT</div>
            </div>
            <div className="w-[400px] font-bold capitalize h-[100px] m-3 text-center rounded-3xl">
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">IMG</div>
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">TEXT</div>
            </div>
            <div className="w-[400px] font-bold capitalize h-[100px] m-3 text-center rounded-3xl">
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">IMG</div>
              <div className="bg-gray-200 h-[100px] min-w-[200px] w-full">TEXT</div>
            </div>
          </div>
          <div className="mt-4 bg-white text-center">
            <div className="font-bold  bg-black text-white text-3xl mt-4 p-3 text-center uppercase">NOS PARTENAIRES</div>
            <div className="w-[200px] font-bold uppercase h-[100px] m-3 text-center rounded-3xl">LOGOS PARTENAIRES</div>
          </div>
          <div className="mt-4 bg-white text-center">
            <div className="font-bold  bg-black text-white text-3xl mt-4 p-3 text-center uppercase">TEMOIGNAGES</div>
            <div className="w-[200px] font-bold uppercase h-[100px] m-3 text-center rounded-3xl">tEMOIGNAGES</div>
          </div>
          <div className="bg-gray-400 mt-4 p-4 text-center flex justify-center items-center">
            <h2 className="text-2xl font-bold">ABONNEZ-VOUS A lA NEWSLETTER</h2>
            <div className="flex p-4 justify-center">
              <input type="email" placeholder="Enter your email" className="border border-gray-300 rounded-l-lg p-2" />
              <button className="bg-blue-500 text-white rounded-r-lg px-4 py-2">Subscribe</button>
              </div>
          </div>
      </div>
      </DefaultTemplate>
  );
}
