// FILE: src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Celestia",
  description: "Transform the unseen signatures of orbital satellites into one-of-a-kind masterpieces using generative AI. Explore a gallery of cosmic art or create your own.",
  keywords: ['AI art', 'generative art', 'space art', 'satellite data', 'TLE', 'cosmic art', 'creative AI', 'data visualization', 'AI art generator'],
  authors: [{ name: 'msunkara', url: 'https://msunkara.de/' }],
  creator: 'msunkara',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className="bg-primary-dark text-gray-200">
        <Navbar />
        {/* Main content now has a z-index to sit on top of the particle canvas */}
        <main className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}