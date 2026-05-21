import type { Metadata } from "next";
import React from "react";
import { Cormorant, Inter } from "next/font/google";
import "@/app/globals.css";
import "react-dadata/dist/react-dadata.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
  display: "swap",
});

const cormorant = Cormorant({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fashion Store",
  description: "E-commerce with outfit builder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
            {children}
          </main>
          <footer className="mt-20 border-t">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6">
              <div className="grid gap-8 sm:grid-cols-3">
                <div className="grid gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Магазин</p>
                  <div className="grid gap-2">
                    <a href="/catalog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Каталог</a>
                    <a href="/outfits" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Готовые образы</a>
                    <a href="/outfit-builder" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Конструктор образов</a>
                  </div>
                </div>
                <div className="grid gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Аккаунт</p>
                  <div className="grid gap-2">
                    <a href="/profile" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Профиль</a>
                    <a href="/wishlist" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Избранное</a>
                    <a href="/cart" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Корзина</a>
                  </div>
                </div>
                <div className="grid gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Информация</p>
                  <div className="grid gap-2">
                    <a href="/delivery" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Доставка и возврат</a>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between border-t pt-6">
                <p className="font-serif text-lg font-light tracking-[0.15em]" style={{ fontFamily: "var(--font-serif)" }}>
                  FASHION STORE
                </p>
                <p className="text-xs text-muted-foreground">© 2025 Fashion Store</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
