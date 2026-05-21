"use client";

import type { ToastContextValue } from "@/components/ui/toast";

export const AUTH_DIALOG_OPEN_EVENT = "fashion-store:open-auth-dialog";
export const AUTH_STATE_CHANGED_EVENT = "fashion-store:auth-state-changed";

export const AUTH_REQUIRED_MESSAGES = {
  outfitSave: "Чтобы сохранить образ, необходимо авторизоваться",
  checkout: "Чтобы продолжить оформление, необходимо авторизоваться",
} as const;

export type AuthRequiredReason = keyof typeof AUTH_REQUIRED_MESSAGES;

export function requestAuthRequired(
  showToast: ToastContextValue["showToast"],
  reason: AuthRequiredReason,
) {
  showToast(AUTH_REQUIRED_MESSAGES[reason], "error");
  window.dispatchEvent(new Event(AUTH_DIALOG_OPEN_EVENT));
}

export function notifyAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}
