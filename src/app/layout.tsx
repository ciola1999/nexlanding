import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";

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
  description: "Portfolio Agency Premium. Kami membangun website berkelas dengan Next.js 14, Tailwind CSS, dan animasi GSAP untuk bisnis Anda.",
  keywords: ["Jasa Website", "Web Developer Indonesia", "Next.js Portfolio", "Frontend Developer"],
  authors: [{ name: "Nama Kamu", url: "https://nexlanding.vercel.app" }], // Ganti URL Vercel kamu
  openGraph: {
    title: "NexLanding | Jasa Website Modern & Animasi",
    description: "Siap mendominasi pasar digital? Cek portfolio website animasi kelas dunia di sini.",
    url: "https://nexlanding.vercel.app", // Ganti URL Vercel kamu
    siteName: "NexLanding",
    images: [
      {
        url: "https://i.ibb.co.com/T0CqnS0/og-image-example.png", // Nanti kita ganti gambar sendiri
        width: 1200,
        height: 630,
      },
    ],
    locale: "id_ID",
    type: "website",
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
        <Preloader />
        <CustomCursor />
        <SmoothScroll>
        <Navbar />
        {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
