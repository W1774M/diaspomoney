import {
  AppointmentProvider,
  AuthProvider,
  ThemeProvider,
} from "@/components/features/providers";
import { NotificationContainer } from "@/components/ui/Notification";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Inter({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diaspomoney",
  description: "Le lieu parfait pour acheter vos services pour la diaspora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppointmentProvider>
            <ThemeProvider>
              {children}
              <NotificationContainer />
            </ThemeProvider>
          </AppointmentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
