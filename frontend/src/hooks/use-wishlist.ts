"use client";

import { useEffect, useState } from "react";
import { addToWishlist, fetchWishlist } from "@/lib/api";

export function useWishlist() {
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchWishlist()
      .then((items) => {
        setWishlistProductIds(new Set(items.map((item) => item.product.id)));
      })
      .catch(() => {
        setWishlistProductIds(new Set());
      });
  }, []);

  async function addProductToWishlist(productId: string) {
    try {
      const updatedWishlist = await addToWishlist(productId);
      setWishlistProductIds(new Set(updatedWishlist.map((item) => item.product.id)));
      setStatus("Товар добавлен в избранное.");
    } catch {
      setStatus("Для добавления в избранное требуется вход.");
    }
  }

  return {
    wishlistProductIds,
    status,
    setStatus,
    addProductToWishlist,
  };
}
