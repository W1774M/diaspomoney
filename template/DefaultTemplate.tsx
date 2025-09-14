"use client";

import Footer from "@/components/layout/footer/Footer";
import Header from "@/components/layout/header/header";

const DefaultTemplate = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};
export default DefaultTemplate;
