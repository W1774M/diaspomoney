"use client";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();

  function handleRedirect(path: string) {
    router.push(path);
  }

  return (
    <header className="bg-black text-white shadow-sm sticky top-0 z-20 w-full">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => handleRedirect("/")}
          >
            <Image
              src="/img/logos/Logo_DispoMoney_horiz_CMJN_web.png"
              width={200}
              height={100}
              alt="Diaspomoney"
              loading="lazy"
              priority={false}
            />
          </h1>
          <span className="text-sm ml-2 hidden md:inline">
            Je transfère un service, et non l&apos;argent !
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            className="bg-[hsl(23,100%,53%)] text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition flex items-center cursor-pointer"
            onClick={() => handleRedirect("/provider")}
            type="button"
          >
            Transférer un service
          </button>
          <Link
            href="/login"
            className="text-white hover:text-[hsl(23,100%,53%)]"
          >
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
