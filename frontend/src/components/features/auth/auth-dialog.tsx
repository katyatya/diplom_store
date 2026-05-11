"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { login, logout, mergeGuestCartToServer, register } from "@/lib/api";
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

type AuthMode = "login" | "register";

export type AuthUser = { sub: string; email: string; role: "USER" | "ADMIN" };

type AuthDialogProps = {
  user: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
};

export function AuthDialog({ user, onUserChange }: AuthDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("user@fashionstore.local");
  const [password, setPassword] = useState("User123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload =
        mode === "login"
          ? await login(email.trim(), password)
          : await register(email.trim(), password);

      await mergeGuestCartToServer();
      onUserChange(payload.user);
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
    showToast("Вы вышли из аккаунта.");
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" aria-label="Открыть вход и регистрацию">
          <UserRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Личный кабинет" : mode === "login" ? "Вход" : "Регистрация"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Управление профилем и сессией."
              : "Войдите в аккаунт или зарегистрируйтесь."}
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">Вы вошли как {user.email}</p>
            <Button asChild variant="secondary" onClick={() => setIsOpen(false)}>
              <Link href="/profile">Перейти в профиль</Link>
            </Button>
            <Button variant="outline" onClick={() => void onLogout()}>
              Выйти
            </Button>
          </div>
        ) : (
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as AuthMode)}
            className="grid gap-3"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-0">
              <AuthForm
                email={email}
                password={password}
                isSubmitting={isSubmitting}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={onAuthSubmit}
                submitLabel="Войти"
              />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <AuthForm
                email={email}
                password={password}
                isSubmitting={isSubmitting}
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
  email: string;
  password: string;
  isSubmitting: boolean;
  submitLabel: string;
  onEmailChange: (nextValue: string) => void;
  onPasswordChange: (nextValue: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

function AuthForm({
  email,
  password,
  isSubmitting,
  submitLabel,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  return (
    <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
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
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Подождите..." : submitLabel}
      </Button>
    </form>
  );
}
