"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, User } from "lucide-react";
import { type AuthUser, fetchMe } from "@/lib/api";
import { AuthDialog } from "@/components/features/auth/auth-dialog";

const navLinks: Array<{ href: string; label: string }> = [
  { href: "/catalog", label: "Каталог" },
  { href: "/outfit-builder", label: "Конструктор" },
  { href: "/outfits", label: "Образы" },
];

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="font-light tracking-[0.25em] text-foreground"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}
        >
          FASHION STORE
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <Link
              href="/wishlist"
              aria-label="Избранное"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <Heart size={18} strokeWidth={1.5} />
            </Link>
          ) : null}
          <Link
            href="/cart"
            aria-label="Корзина"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
          </Link>
          {user ? (
            <Link
              href="/profile"
              aria-label="Профиль"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center text-muted-foreground">
              <AuthDialog user={user} onUserChange={setUser} iconOnly />
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Открыть меню"
            className="ml-2 flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={`block h-px w-5 bg-foreground transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-foreground transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen ? (
        <div className="border-t bg-white md:hidden">
          <nav className="mx-auto flex w-full max-w-[1200px] flex-col px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b py-3 text-sm uppercase tracking-[0.15em] text-muted-foreground last:border-0 hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
