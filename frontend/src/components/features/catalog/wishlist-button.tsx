"use client";

import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  active: boolean;
  onClick: () => void;
  className?: string;
};

export function WishlistButton({ active, onClick, className }: WishlistButtonProps) {
  return (
    <button
      type="button"
      aria-label="Добавить в избранное"
      className={cn("text-lg leading-none", className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      ♡
    </button>
  );
}
