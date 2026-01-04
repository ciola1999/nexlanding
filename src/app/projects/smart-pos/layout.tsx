// src/app/projects/smart-pos/layout.tsx
import React from "react";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 Tambahkan 'cursor-default' di sini untuk membatalkan cursor:none global
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans cursor-default">
      
      {/* Area ini sekarang akan menampilkan kursor panah standar */}
      <main className="w-full h-full">
        {children}
      </main>

    </div>
  );
}