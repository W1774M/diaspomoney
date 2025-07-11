import Image from "next/image";
import Link from "next/link";
import CarouselFooter from "./carousel-footer";

const FooterLinks = ({
  links,
  label,
}: {
  links: { href: string; text: string; target?: string; rel?: string }[];
  label?: string;
}) => {
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4 text-[hsl(25,100%,53%)]">
        {label}
      </h4>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={`footer-link-${index}`}>
            <Link
              href={link.href}
              className="text-gray-400 hover:text-white"
              target={link?.target}
              rel={link?.rel}
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FooterComponent = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Image
              width={300}
              height={100}
              src="/img/logos/Logo_DispoMoney_horiz_White _web.png"
              alt="DiaspoMoney logo"
              className=""
            />
            <p className="text-gray-400 mt-2">
              Transférez des services, pas de largent, pour une économie
              durable.
            </p>
          </div>

          <FooterLinks
            label="Services"
            links={[
              {
                href: "https://diaspomoney.fr/",
                text: "Santé",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              { href: "#", text: "Éducation" },
              { href: "#", text: "Immobilier & BTP" },
            ]}
          />

          <FooterLinks
            label="À propos"
            links={[
              {
                href: "https://diaspomoney.fr/a-propos/",
                text: "Notre équipe",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              { href: "#", text: "Comment ça marche" },
              { href: "#", text: "FAQ" },
            ]}
          />

          <FooterLinks
            label="Contact"
            links={[
              { href: "#", text: "contact@diaspomoney.fr" },
              { href: "#", text: "+33 6 51 27 65 70" },
            ]}
          />
        </div>

        <div className="border-t border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[hsl(25,100%,53%)] uppercase">
              Localisation
            </h4>
            <Image
              width={100}
              height={50}
              src="/img/logos/map_of_france-1024x725.png"
              alt="DiaspoMoney logo"
            />
            <p className="text-sm font-bold">Seine Innopolis,</p>
            <p className="text-sm">
              72 Rue de la République,
              <br /> 76140, Le Petit-Qu evilly{" "}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[hsl(25,100%,53%)] uppercase text-center">
              devenez prestataire diaspomoney
            </h4>
            <ul className="space-y-2 mt-5">
              <li className="text-center">
                <Link
                  href="#"
                  className="text-black hover:text-white font-bold uppercase bg-[hsl(25,100%,53%)] px-5 py-2 rounded-full"
                >
                  Nous Contacter
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-center text-[hsl(25,100%,53%)] uppercase">
              NOTRE Présence en afrique
            </h4>
            <ul className="space-y-2">
              <li>
                <CarouselFooter />
              </li>
              <li className="text-center">
                Cameroun – Côte d’Ivoire – Sénégal…
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 DiaspoMoney. Tous droits réservés.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">
              Conditions générales
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default FooterComponent;
