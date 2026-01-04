// src/app/(portfolio)/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// ❌ HAPUS import "../globals.css"; (Sudah ada di root)
import Navbar from "@/components/landing/Navbar";
import SmoothScroll from "@/components/landing/SmoothScroll";
import CustomCursor from "@/components/landing/CustomCursor";
import Preloader from "@/components/landing/Preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexLanding | Jasa Website Modern & Animasi",
  description: "Portfolio Agency Premium...",
  // ... (sisanya sama, metadata ini akan menimpa metadata root)
};

export default function PortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ❌ JANGAN PAKAI <html> atau <body>
    // ✅ Ganti dengan div atau Fragment
    // Kita pasang Font Geist di div ini agar menimpa Font Inter dari Root
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <Preloader />
        <CustomCursor />
        
        <SmoothScroll>
            <Navbar />
            <main>
                {children}
            </main>
            {/* Footer nanti taruh sini */}
        </SmoothScroll>
    </div>
  );
}