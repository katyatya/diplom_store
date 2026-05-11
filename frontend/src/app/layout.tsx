import type { Metadata } from "next";
import React from "react";
import "@/app/globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Fashion Store",
  description: "E-commerce with outfit builder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-5">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
