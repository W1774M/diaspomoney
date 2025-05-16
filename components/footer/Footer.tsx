import Image from "next/image";
import Link from "next/link";
import CarouselFooter from "./carousel-footer";

const FooterComponent = () => {
  return (
    <footer className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Image width={300} height={100} src="/img/logos/Logo_DispoMoney_horiz_White _web.png" alt="DiaspoMoney logo" className='' />
              <p className="text-gray-400 mt-2">
                Transférez des services, pas de largent, pour une économie durable.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Santé</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Éducation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Immobilier & BTP</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">À propos</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Notre équipe</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Comment ça marche</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">contact@diaspomoney.fr</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">+33 6 51 27 65 70</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[hsl(25,100%,53%)] uppercase">Localisation</h3>
              <Image width={100} height={50} src="/img/logos/map_of_france-1024x725.png" alt="DiaspoMoney logo" />
              <p className="text-sm font-bold">Seine Innopolis,</p>
              <p className="text-sm">72 Rue de la République,<br /> 76140, Le Petit-Qu          evilly </p>
            </div> 
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[hsl(25,100%,53%)] uppercase">devenez prestataire diaspomoney</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Nous Contacter</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4  text-[hsl(25,100%,53%)] uppercase">NOTRE Présence en afrique</h4>
              <ul className="space-y-2">
                <li>
                  <CarouselFooter />
                </li>
                <li>Cameroun – Côte d’Ivoire – Sénégal…</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 DiaspoMoney. Tous droits réservés.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Conditions générales</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
  )

}
export default FooterComponent;