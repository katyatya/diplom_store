export type AdminSection = "products" | "orders" | "stylistLooks" | "banners" | "collections";

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message?.trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(parsed.message) && parsed.message.length > 0) {
      return parsed.message.join("; ");
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    return raw;
  }
  return raw || fallback;
}

export function localizeAdminErrorMessage(message: string): string {
  const normalized = message.trim();
  const directMap: Record<string, string> = {
    "Collection not found": "Коллекция не найдена.",
    "Banner not found": "Баннер не найден.",
    "Product not found": "Товар не найден.",
    "Order not found": "Заказ не найден.",
    "Some products were not found": "Некоторые выбранные товары не найдены.",
    "Collection slug is invalid":
      "Slug коллекции должен содержать только латинские буквы, цифры и дефис.",
    "Collection title is required": "Введите название коллекции.",
    "Cancel reason is required for cancelled orders": "Укажите причину отмены заказа.",
  };
  if (directMap[normalized]) {
    return directMap[normalized];
  }
  return normalized;
}

export function getAllowedNextStatuses(currentStatus: string, deliveryType: string): string[] {
  const map: Record<string, string[]> = {
    NEW: ["CONFIRMED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    CONFIRMED: ["ASSEMBLING", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    ASSEMBLING:
      deliveryType === "PICKUP"
        ? ["READY_FOR_PICKUP", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"]
        : ["SHIPPED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    READY_FOR_PICKUP: ["DELIVERED", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    SHIPPED: ["DELIVERED", "CANCELLED_OTHER"],
    DELIVERED: [],
    CANCELLED_NO_STOCK: [],
    CANCELLED_BY_CLIENT: [],
    CANCELLED_OTHER: [],
  };
  return [currentStatus, ...(map[currentStatus] ?? [])];
}
