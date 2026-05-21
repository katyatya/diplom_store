"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  type AuthUser,
  login,
  logout,
  mergeGuestCartToServer,
  register,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { AUTH_DIALOG_OPEN_EVENT, notifyAuthStateChanged } from "@/lib/auth-required";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type AuthDialogProps = {
  user: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  iconOnly?: boolean;
};

export function AuthDialog({ user, onUserChange, iconOnly }: AuthDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("user@fashionstore.local");
  const [password, setPassword] = useState("User123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    function onOpenAuthDialog() {
      setMode("login");
      setIsOpen(true);
    }

    window.addEventListener(AUTH_DIALOG_OPEN_EVENT, onOpenAuthDialog);
    return () => window.removeEventListener(AUTH_DIALOG_OPEN_EVENT, onOpenAuthDialog);
  }, []);

  function validateName(rawName: string): string | null {
    const trimmed = rawName.trim();
    if (trimmed.length < 2) return "Имя должно быть не короче 2 символов.";
    if (trimmed.length > 50) return "Имя должно быть не длиннее 50 символов.";
    const isValid = /^[A-Za-zА-Яа-яЁё\s'-]+$/u.test(trimmed);
    if (!isValid) {
      return "Имя может содержать только буквы, пробел, апостроф и дефис.";
    }
    return null;
  }

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const validationError = validateName(name);
        if (validationError) {
          showToast(validationError, "error");
          return;
        }
      }

      const payload =
        mode === "login"
          ? await login(email.trim(), password)
          : await register(name.trim(), email.trim(), password);

      await mergeGuestCartToServer();
      onUserChange(payload.user);
      notifyAuthStateChanged();
      router.refresh();
      showToast(
        mode === "login"
          ? "Вы успешно вошли в аккаунт."
          : "Аккаунт создан и активирован.",
      );
      setIsOpen(false);
    } catch {
      showToast(
        mode === "login"
          ? "Не удалось войти. Проверьте email и пароль."
          : "Не удалось зарегистрироваться. Попробуйте другой email.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onLogout() {
    await logout().catch(() => undefined);
    onUserChange(null);
    notifyAuthStateChanged();
    router.refresh();
    showToast("Вы вышли из аккаунта.");
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <button
            type="button"
            aria-label="Открыть вход и регистрацию"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserRound size={18} strokeWidth={1.5} />
          </button>
        ) : (
          <Button size="icon" variant="outline" aria-label="Открыть вход и регистрацию">
            <UserRound className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle
            className="text-center text-2xl font-light italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {user ? "Личный кабинет" : mode === "login" ? "Войти" : "Регистрация"}
          </DialogTitle>
        </DialogHeader>
        {user ? (
          <div className="grid gap-3">
            <p className="text-center text-sm text-muted-foreground">
              {user.name || "Пользователь"}<br />
              <span className="text-xs">{user.email}</span>
            </p>
            <Button asChild className="h-11 w-full text-xs uppercase tracking-[0.15em]" onClick={() => setIsOpen(false)}>
              <Link href="/profile">Личный кабинет</Link>
            </Button>
            <Button variant="outline" className="h-11 w-full text-xs uppercase tracking-[0.15em]" onClick={() => void onLogout()}>
              Выйти
            </Button>
          </div>
        ) : (
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as AuthMode)}
            className="grid gap-4"
          >
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b">
              <TabsTrigger
                value="login"
                className="rounded-none border-b-2 border-transparent pb-2 text-xs uppercase tracking-[0.15em] data-[state=active]:border-foreground data-[state=active]:shadow-none"
              >
                Вход
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none border-b-2 border-transparent pb-2 text-xs uppercase tracking-[0.15em] data-[state=active]:border-foreground data-[state=active]:shadow-none"
              >
                Регистрация
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-0">
              <AuthForm
                mode="login"
                name={name}
                email={email}
                password={password}
                isSubmitting={isSubmitting}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={onAuthSubmit}
                submitLabel="Войти"
              />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <AuthForm
                mode="register"
                name={name}
                email={email}
                password={password}
                isSubmitting={isSubmitting}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={onAuthSubmit}
                submitLabel="Зарегистрироваться"
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

type AuthFormProps = {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  isSubmitting: boolean;
  submitLabel: string;
  onNameChange: (nextValue: string) => void;
  onEmailChange: (nextValue: string) => void;
  onPasswordChange: (nextValue: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

function AuthForm({
  mode,
  name,
  email,
  password,
  isSubmitting,
  submitLabel,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  return (
    <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
      {mode === "register" ? (
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Имя"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          required
        />
      ) : null}
      <Input
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="Email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="Пароль"
        type="password"
        autoComplete={submitLabel === "Войти" ? "current-password" : "new-password"}
        required
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full text-xs uppercase tracking-[0.15em]"
      >
        {isSubmitting ? "Подождите..." : submitLabel}
      </Button>
    </form>
  );
}
