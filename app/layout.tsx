import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalTossModal } from "@/components/ui/global-toss-modal";
import PlausibleProvider from 'next-plausible';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Die Toss Tournament Manager",
  description: "A tournament bracket management system for die tossing competitions with a bold retro digital aesthetic",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // iOS Safari: extend into safe areas
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlausibleProvider 
          domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || ""}
          enabled={!!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
        >
          <Providers>
            {children}
            <GlobalTossModal />
          </Providers>
        </PlausibleProvider>
      </body>
    </html>
  );
}
