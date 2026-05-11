"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api";
import { AuthDialog, type AuthUser } from "@/components/features/auth/auth-dialog";

const navLinks: Array<{ href: string; label: string }> = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/outfit-builder", label: "Конструктор" },
  { href: "/outfits", label: "Готовые образы" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Корзина" },
  { href: "/checkout", label: "Оформление" },
  { href: "/admin", label: "Админка" },
];

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <nav className="flex flex-wrap items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/profile"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Профиль
            </Link>
          ) : null}
        </nav>
        <AuthDialog user={user} onUserChange={setUser} />
      </div>
    </header>
  );
}
