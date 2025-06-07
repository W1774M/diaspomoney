"use client";
import { User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Header = () => {
  const router = useRouter();

  function handleRedirect(path: string) {
    router.push(path);
  }

  return (
    <header className="bg-black text-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center justify-center">
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
            />
          </h1>
          <span className="text-sm  ml-2 hidden md:inline">
            Je transfère un service, et non largent !
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* <button className="text-gray-600 hover:text-blue-700">
              <MessageCircle size={20} />
            </button> */}
          <button
            className="bg-[hsl(23,100%,53%)] text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition flex items-center hover:cursor-pointer"
            onClick={() => handleRedirect("search")}
          >
            Transférer un service
          </button>
          <Link
            href="/login"
            className="text-white hover:text-[hsl(23,100%,53%)]  hover:cursor-pointer"
          >
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
