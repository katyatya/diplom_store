export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтвержден",
  ASSEMBLING: "Сборка",
  READY_FOR_PICKUP: "Готов к выдаче",
  SHIPPED: "Передан в доставку",
  DELIVERED: "Выдан",
  CANCELLED_NO_STOCK: "Отменен: нет в наличии",
  CANCELLED_BY_CLIENT: "Отменен клиентом",
  CANCELLED_OTHER: "Отменен (прочее)",
};

export function getStatusBadgeClass(status: string): string {
  if (status === "DELIVERED" || status === "READY_FOR_PICKUP") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status.startsWith("CANCELLED")) {
    return "bg-red-100 text-red-700";
  }
  return "bg-amber-100 text-amber-700";
}
