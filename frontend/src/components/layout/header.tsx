"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, ShoppingBag, User } from "lucide-react";
import { type AuthUser, fetchMe, logout } from "@/lib/api";
import { AuthDialog } from "@/components/features/auth/auth-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const navLinks: Array<{ href: string; label: string }> = [
  { href: "/catalog", label: "Каталог" },
  { href: "/outfit-builder", label: "Конструктор" },
  { href: "/outfits", label: "Образы" },
];

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setIsLogoutDialogOpen(false);
      showToast("Вы вышли из аккаунта.");
    } catch {
      showToast("Не удалось выйти из аккаунта.", "error");
    }
  }

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
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="relative text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
            >
              Админка
            </Link>
          ) : null}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
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
          {user ? (
            <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Выйти"
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Подтвердите выход</DialogTitle>
                  <DialogDescription>
                    Вы действительно хотите выйти из аккаунта?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={() => void handleLogout()}>Выйти</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

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
            {user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="border-b py-3 text-sm uppercase tracking-[0.15em] text-muted-foreground last:border-0 hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                Админка
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
